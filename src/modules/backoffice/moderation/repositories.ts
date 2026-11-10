import { db } from '../../../config/database';
import { fetchResourceByPage } from '../../../shared/helpers';
import { writeAudit } from '../shared/lib/audit';
import { hideContent } from '../shared/lib/content-moderation';
import { BadException, ForbiddenException, HttpException, NotFoundException } from '../shared/lib/errors';
import { adminHasPermission } from '../shared/lib/permissions';
import { ActorContext } from '../shared/lib/request-context';
import { ModerationNotice, recordNotice } from '../shared/lib/user-notify';
import { changeStanding, sendWarning } from '../shared/lib/user-standing';
import { AccountStanding } from '../../../shared/services/account-standing';
import * as dtos from './dto';
import * as entities from './entities';
import ModerationQuery from './query';

const person = (row: any, prefix: string): entities.PersonSummary => ({
  id: row[`${prefix}_id`],
  username: row[`${prefix}_username`] ?? null,
  display_name: row[`${prefix}_display_name`] ?? null,
  avatar: row[`${prefix}_avatar`] ?? null,
});

const media = (value: unknown): { url: string; type?: string; thumbnail_url?: string }[] => {
  const list = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(list) ? list.filter((item) => item && typeof item.url === 'string') : [];
};

export const toReport = (row: any): entities.ReportEntity => new entities.ReportEntity({
  id: row.id,
  entity_type: row.entity_type,
  entity_id: row.entity_id,
  reason: row.reason,
  reason_code: row.reason_code,
  reason_label: row.reason_label ?? row.reason,
  severity: Number(row.severity ?? 1),
  details: row.details,
  status: row.status,
  decision: row.decision,
  account_action: row.account_action,
  resolution_notes: row.resolution_notes,
  created_at: row.created_at,
  review_started_at: row.review_started_at,
  resolved_at: row.resolved_at,
  reporter: person(row, 'reporter'),
  owner: {
    ...person(row, 'owner'),
    moderation_status: row.owner_moderation_status ?? 'active',
    suspended_until: row.owner_suspended_until,
  },
  moderator: row.moderator_id ? { id: row.moderator_id, name: row.moderator_name ?? '' } : null,
  content: {
    text: row.content_text,
    media: media(row.content_media),
    created_at: row.content_created_at,
    hidden: !!row.content_hidden_at,
    deleted: !!row.content_deleted,
    ...(row.entity_type === 'comment' ? { post_id: row.comment_post_id } : {}),
  },
});

// The report decision recorded in the app's original moderator_action column.
const legacyAction = { no_action: 'no_action', remove_content: 'content_removed', account_action: 'user_action_taken' } as const;
// An account action needs the matching Users permission on top of moderation:update.
const accountActionPermission = { warning: 'users:warn', suspend: 'users:update', ban: 'users:ban' } as const;

export interface ResolveResult {
  report: entities.ReportDetailEntity;
  sideEffects: { userId: string; standing?: AccountStanding; notice: ModerationNotice | null }[];
}

export class ModerationRepositoryImpl {
  public async fetchReports(payload: dtos.FetchReportsDTO): Promise<[any, entities.ReportEntity[]]> {
    const [meta, rows] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: ModerationQuery.fetchReports,
      params: [
        payload.search ?? '',
        payload.status ?? null,
        payload.reason ?? null,
        payload.entity_type ?? null,
        payload.from ?? null,
        payload.to ?? null,
        payload.moderator_id ?? null,
        payload.sort ?? 'newest',
        payload.owner_id ?? null,
        payload.reporter_id ?? null,
      ],
    });
    return [meta, rows.map(toReport)];
  };

  public async fetchReportById(reportId: string): Promise<NotFoundException | entities.ReportDetailEntity> {
    const row = await db.oneOrNone(ModerationQuery.fetchReportById, [reportId]);
    if (!row) return new NotFoundException('Report not found.');
    const [ownerCounts, reporterCounts, related] = await Promise.all([
      db.one(ModerationQuery.userReportCounts, [row.owner_id]),
      db.one(ModerationQuery.userReportCounts, [row.reporter_id]),
      db.manyOrNone(ModerationQuery.fetchRelatedReports, [row.entity_type, row.entity_id, row.id]),
    ]);
    const base = toReport(row);
    return new entities.ReportDetailEntity({
      ...base,
      owner_profile: {
        created_at: row.owner_created_at,
        status: row.owner_status,
        bio: row.owner_bio,
        deleted: !!row.owner_deleted_at,
        ...ownerCounts,
      },
      reporter_profile: {
        created_at: row.reporter_created_at,
        reports_against: reporterCounts.reports_against,
        reports_submitted: reporterCounts.reports_submitted,
      },
      engagement: {
        likes: row.entity_type === 'post' ? row.post_likes_count : null,
        comments: row.entity_type === 'post' ? row.post_comments_count : null,
        reports: row.entity_type === 'post'
          ? row.post_report_count
          : row.entity_type === 'comment' ? row.comment_report_count : related.length + 1,
      },
      related_reports: related.map((item) => ({
        id: item.id,
        reason: item.reason,
        reason_label: item.reason_label ?? item.reason,
        status: item.status,
        created_at: item.created_at,
        reporter_username: item.reporter_username,
      })),
    });
  };

  public async startReview(reportId: string, actor: ActorContext): Promise<HttpException | entities.ReportDetailEntity> {
    try {
      await db.tx(async (t) => {
        const report = await t.oneOrNone(ModerationQuery.lockReport, [reportId]);
        if (!report) throw new NotFoundException('Report not found.');
        if (report.status === 'resolved') throw new BadException('This report has already been resolved.');
        if (report.status === 'under_review') return;
        await t.none(ModerationQuery.startReview, [reportId, actor.adminId]);
        await writeAudit(t, {
          actorId: actor.adminId,
          action: 'report:start_review',
          module: 'moderation',
          entityType: 'report',
          entityReference: reportId,
          before: { status: report.status },
          after: { status: 'under_review' },
          ip: actor.ip,
        });
      });
      return await this.fetchReportById(reportId);
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };

  public async resolveReport(
    payload: dtos.ResolveReportDTO, actor: ActorContext & { roleId?: string | null; isRoot?: boolean },
  ): Promise<HttpException | ResolveResult> {
    try {
      if (payload.decision === 'account_action' && payload.account_action && !actor.isRoot) {
        const needed = accountActionPermission[payload.account_action];
        if (!(await adminHasPermission(actor.roleId, needed))) {
          return new ForbiddenException('You do not have permission to take this account action.');
        }
      }
      const sideEffects: ResolveResult['sideEffects'] = [];
      await db.tx(async (t) => {
        const report = await t.oneOrNone(ModerationQuery.lockReport, [payload.report_id]);
        if (!report) throw new NotFoundException('Report not found.');
        if (report.status === 'resolved') throw new BadException('This report has already been resolved.');
        const notes = payload.notes?.trim() || null;
        const reasonLabel = report.reason;

        if (payload.decision === 'remove_content') {
          if (report.entity_type !== 'post' && report.entity_type !== 'comment') {
            throw new BadException('Only posts and comments can be removed. Take an account action instead.');
          }
          const content = await hideContent(t, {
            type: report.entity_type,
            id: report.entity_id,
            adminId: actor.adminId,
            reason: reasonLabel,
            reportId: report.id,
          });
          await writeAudit(t, {
            actorId: actor.adminId,
            action: `${report.entity_type}:hide`,
            module: 'moderation',
            entityType: report.entity_type,
            entityReference: report.entity_id,
            after: { reason: reasonLabel, report_id: report.id, preview: content.preview, notes },
            ip: actor.ip,
          });
          if (payload.notify) {
            const notice: ModerationNotice = {
              userId: content.ownerId,
              type: 'moderation_content_removed',
              title: `Your ${report.entity_type === 'post' ? 'testimony' : 'comment'} was removed`,
              message: `Your ${report.entity_type === 'post' ? 'testimony' : 'comment'} was removed for breaking the community guidelines (${reasonLabel}).`,
              entityType: report.entity_type,
              entityId: report.entity_id,
              data: { preview: content.preview },
              email: false,
            };
            await recordNotice(t, notice);
            sideEffects.push({ userId: content.ownerId, notice });
          }
        }

        if (payload.decision === 'account_action') {
          if (payload.account_action === 'warning') {
            const result = await sendWarning(t, {
              userId: report.content_owner_id,
              templateKey: payload.warning_template ?? null,
              message: payload.warning_template ? null : notes ?? `Content you shared was reported for: ${reasonLabel}. Please review the community guidelines.`,
              sendEmail: payload.notify,
              reportId: report.id,
              actor,
              module: 'moderation',
            });
            sideEffects.push({ userId: report.content_owner_id, notice: result.notice });
          } else {
            const result = await changeStanding(t, {
              userId: report.content_owner_id,
              action: payload.account_action === 'ban' ? 'ban' : 'suspend',
              durationDays: payload.account_action === 'suspend' ? payload.duration_days ?? null : null,
              reasonCode: report.reason_code,
              reason: reasonLabel,
              note: notes,
              notify: payload.notify,
              reportId: report.id,
              actor,
              module: 'moderation',
            });
            sideEffects.push({ userId: result.userId, standing: result.standing, notice: result.notice });
          }
        }

        const resolved = await t.many(ModerationQuery.resolveReports, [
          report.id,
          report.entity_id,
          payload.decision,
          legacyAction[payload.decision],
          payload.decision === 'account_action' ? payload.account_action : null,
          notes,
          actor.adminId,
          report.entity_type,
        ]);
        await writeAudit(t, {
          actorId: actor.adminId,
          action: 'report:resolve',
          module: 'moderation',
          entityType: 'report',
          entityReference: report.id,
          before: { status: report.status },
          after: {
            status: 'resolved',
            decision: payload.decision,
            account_action: payload.account_action ?? null,
            reason: reasonLabel,
            notes,
            also_resolved: resolved.map((row) => row.id).filter((id) => id !== report.id),
          },
          ip: actor.ip,
        });
      });
      const report = await this.fetchReportById(payload.report_id);
      if (report instanceof HttpException) return report;
      return { report, sideEffects };
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };

  public async summary(payload: dtos.SummaryDTO) {
    return db.one(ModerationQuery.summary, [payload.from ?? null, payload.to ?? null]);
  };

  public async moderators(): Promise<{ id: string; name: string }[]> {
    const rows = await db.manyOrNone(ModerationQuery.moderators);
    return rows.map((row) => ({ id: row.id, name: row.name ?? row.email }));
  };

  public async reasons(): Promise<{ code: string; label: string; severity: number }[]> {
    return db.manyOrNone(ModerationQuery.reasons);
  };

  public async userExists(userId: string): Promise<boolean> {
    return !!(await db.oneOrNone('SELECT 1 FROM users WHERE id = $1;', [userId]));
  };
}

const moderationRepository = new ModerationRepositoryImpl();

export default moderationRepository;
