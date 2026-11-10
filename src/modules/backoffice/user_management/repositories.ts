import { db } from '../../../config/database';
import { fetchResourceByPage } from '../../../shared/helpers';
import { writeAudit } from '../shared/lib/audit';
import { BadException, ForbiddenException, HttpException, NotFoundException } from '../shared/lib/errors';
import { ActorContext } from '../shared/lib/request-context';
import {
  StandingAction,
  WARNING_TEMPLATES,
  afterStandingChange,
  changeStanding,
  sendWarning,
} from '../shared/lib/user-standing';
import logger from '../../../shared/services/logger';
import * as dtos from './dto';
import UserQuery from './query';

const parseMedia = (value: unknown) => {
  const list = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(list) ? list.filter((item: any) => item && typeof item.url === 'string') : [];
};

const userRow = ({ count, ...row }: any) => ({
  id: row.id,
  username: row.username,
  display_name: row.display_name,
  first_name: row.first_name,
  last_name: row.last_name,
  email: row.email,
  avatar: row.avatar,
  status: row.status,
  moderation_status: row.moderation_status,
  suspended_until: row.moderation_status === 'suspended' ? row.suspended_until : null,
  created_at: row.created_at,
  last_login: row.last_login,
  reports_against: row.reports_against,
  restriction: row.moderation_status !== 'active' && row.last_action
    ? {
      type: row.moderation_status,
      reason: row.restriction_reason,
      reason_code: row.restriction_reason_code,
      started_at: row.restricted_at,
      duration_days: row.restriction_days,
      last_action_at: row.last_action_at,
    }
    : null,
});

type Actor = ActorContext & { isRoot?: boolean };

export class UserManagementRepositoryImpl {
  public async fetchUsers(payload: dtos.FetchUsersDTO): Promise<[any, any[]]> {
    const [meta, rows] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: UserQuery.fetchUsers,
      params: [
        payload.search ?? '',
        payload.status ?? null,
        payload.flagged ?? null,
        payload.joined_from ?? null,
        payload.joined_to ?? null,
        payload.sort ?? 'newest',
      ],
    });
    return [meta, rows.map(userRow)];
  };

  /** Profile with account statistics. Viewing is recorded in the audit log. */
  public async fetchUserById(userId: string, actor: ActorContext): Promise<NotFoundException | any> {
    const row = await db.oneOrNone(UserQuery.fetchUserById, [userId]);
    if (!row) return new NotFoundException('User not found.');
    await writeAudit(db, {
      actorId: actor.adminId,
      action: 'user:view_profile',
      // Own module so views don't crowd moderation actions out of the Audit Log's default view.
      module: 'user_views',
      entityType: 'user',
      entityReference: userId,
      ip: actor.ip,
    }).catch((error) => logger.error(`audit failed: ${error}`, 'user_management.repositories.ts'));
    return {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone_number: row.phone_number ? `${row.country_code ?? ''}${row.phone_number}` : null,
      avatar: row.avatar,
      header_image: row.header_image,
      bio: row.bio,
      status: row.status,
      moderation_status: row.moderation_status,
      suspended_until: row.moderation_status === 'suspended' ? row.suspended_until : null,
      moderation_updated_at: row.moderation_updated_at,
      created_at: row.created_at,
      activated_at: row.activated_at,
      last_login: row.last_login,
      stats: {
        posts: row.posts,
        hidden_posts: row.hidden_posts,
        comments: row.comments,
        hidden_comments: row.hidden_comments,
        likes_given: row.likes_given,
        likes_received: row.likes_received,
        tribe_following: row.tribe_following,
        tribe_followers: row.tribe_followers,
        circle: row.circle,
        communities: row.communities,
        reports_against: row.reports_against,
        reports_submitted: row.reports_submitted,
        warnings: row.warnings,
        enforcement_actions: row.enforcement_actions,
        notes: row.notes,
      },
    };
  };

  public async fetchFlaggedContent(payload: dtos.FlaggedContentDTO): Promise<NotFoundException | [any, any[]]> {
    if (!(await db.oneOrNone(UserQuery.userExists, [payload.user_id]))) return new NotFoundException('User not found.');
    const [meta, rows] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: UserQuery.fetchFlaggedContent,
      params: [payload.user_id, payload.sort ?? 'recent'],
    });
    return [meta, rows.map(({ count, ...row }: any) => ({
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      post_id: row.entity_type === 'comment' ? row.post_id : row.entity_id,
      content: row.content,
      media: parseMedia(row.media),
      posted_at: row.posted_at,
      report_count: row.report_count,
      reasons: row.reasons,
      severity: row.severity,
      first_reported_at: row.first_reported_at,
      last_reported_at: row.last_reported_at,
      has_open_reports: row.has_open_reports,
      hidden: !!row.hidden_at,
      deleted_by_author: row.deleted_by_author,
    }))];
  };

  /** Enforcement actions and warnings, newest first. */
  public async fetchModerationHistory(userId: string): Promise<NotFoundException | any[]> {
    if (!(await db.oneOrNone(UserQuery.userExists, [userId]))) return new NotFoundException('User not found.');
    const [actions, warnings] = await Promise.all([
      db.manyOrNone(UserQuery.fetchActions, [userId]),
      db.manyOrNone(UserQuery.fetchWarnings, [userId]),
    ]);
    const entries = [
      ...actions.map((row) => ({
        id: row.id,
        kind: row.action,
        reason: row.reason,
        reason_code: row.reason_code,
        note: row.note,
        duration_days: row.duration_days,
        ends_at: row.ends_at,
        report_id: row.report_id,
        notified: row.notified,
        created_at: row.created_at,
        performed_by: row.performed_by_admin_id ? { id: row.performed_by_admin_id, name: row.performed_by_name ?? '' } : null,
      })),
      ...warnings.map((row) => ({
        id: row.id,
        kind: 'warning',
        reason: row.message,
        template_key: row.template_key,
        report_id: row.report_id,
        notified: true,
        emailed: row.emailed,
        acknowledged_at: row.acknowledged_at,
        created_at: row.created_at,
        performed_by: row.sent_by_admin_id ? { id: row.sent_by_admin_id, name: row.sent_by_name ?? '' } : null,
      })),
    ];
    return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  public async changeStanding(
    action: StandingAction, payload: dtos.StandingChangeDTO, actor: ActorContext,
  ): Promise<HttpException | any> {
    try {
      const result = await db.tx((t) => changeStanding(t, {
        userId: payload.user_id,
        action,
        durationDays: payload.duration_days ?? null,
        reasonCode: payload.reason_code || null,
        reason: payload.reason,
        note: payload.note,
        notify: payload.notify,
        actor,
        module: 'users',
      }));
      await afterStandingChange(result).catch((error) => logger.error(`standing side effect failed: ${error}`, 'user_management.repositories.ts'));
      return { user_id: result.userId, moderation_status: result.standing.status, suspended_until: result.standing.until };
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };

  // ---- Notes ----------------------------------------------------------------------------------

  public async fetchNotes(userId: string): Promise<NotFoundException | any[]> {
    if (!(await db.oneOrNone(UserQuery.userExists, [userId]))) return new NotFoundException('User not found.');
    const rows = await db.manyOrNone(UserQuery.fetchNotes, [userId]);
    return rows.map((row) => ({
      id: row.id,
      body: row.body,
      tag: row.tag,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: row.author_admin_id ? { id: row.author_admin_id, name: row.author_name ?? '' } : null,
    }));
  };

  public async createNote(payload: dtos.NoteDTO, actor: ActorContext): Promise<HttpException | any[]> {
    try {
      await db.tx(async (t) => {
        if (!(await t.oneOrNone(UserQuery.userExists, [payload.user_id]))) throw new NotFoundException('User not found.');
        const note = await t.one(UserQuery.createNote, [payload.user_id, actor.adminId, payload.body, payload.tag ?? null]);
        await writeAudit(t, {
          actorId: actor.adminId,
          action: 'user:note_add',
          module: 'users',
          entityType: 'user',
          entityReference: payload.user_id,
          after: { note_id: note.id, tag: payload.tag ?? null },
          ip: actor.ip,
        });
      });
      return await this.fetchNotes(payload.user_id);
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };

  /** Only the author may edit or delete a note, unless the admin holds the root account. */
  public async updateNote(payload: dtos.NoteDTO, actor: Actor, remove = false): Promise<HttpException | any[]> {
    try {
      await db.tx(async (t) => {
        const note = await t.oneOrNone(UserQuery.findNote, [payload.note_id, payload.user_id]);
        if (!note) throw new NotFoundException('Note not found.');
        if (note.author_admin_id !== actor.adminId && !actor.isRoot) {
          throw new ForbiddenException('Only the author can change this note.');
        }
        if (remove) await t.none(UserQuery.deleteNote, [note.id]);
        else await t.none(UserQuery.updateNote, [note.id, payload.body, payload.tag ?? null]);
        await writeAudit(t, {
          actorId: actor.adminId,
          action: remove ? 'user:note_delete' : 'user:note_edit',
          module: 'users',
          entityType: 'user',
          entityReference: payload.user_id,
          before: { note_id: note.id, tag: note.tag },
          after: remove ? null : { note_id: note.id, tag: payload.tag ?? null },
          ip: actor.ip,
        });
      });
      return await this.fetchNotes(payload.user_id);
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };

  // ---- Warnings -------------------------------------------------------------------------------

  public warningTemplates() {
    return WARNING_TEMPLATES.map(({ key, label, message }) => ({ key, label, message }));
  };

  public async sendWarning(payload: dtos.WarningDTO, actor: ActorContext): Promise<HttpException | { id: string }> {
    try {
      const result = await db.tx((t) => sendWarning(t, {
        userId: payload.user_id,
        templateKey: payload.template_key ?? null,
        message: payload.message ?? null,
        sendEmail: payload.send_email,
        actor,
        module: 'users',
      }));
      await afterStandingChange({ userId: payload.user_id, notice: result.notice })
        .catch((error) => logger.error(`warning delivery failed: ${error}`, 'user_management.repositories.ts'));
      return { id: result.warningId };
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };

  // ---- App side: the warned user acknowledges -------------------------------------------------

  public async pendingWarnings(userId: string) {
    return db.manyOrNone(UserQuery.pendingWarnings, [userId]);
  };

  public async acknowledgeWarning(userId: string, warningId: string): Promise<NotFoundException | void> {
    const row = await db.oneOrNone(UserQuery.acknowledgeWarning, [warningId, userId]);
    if (!row) return new NotFoundException('Warning not found or already acknowledged.');
  };
}

const userManagementRepository = new UserManagementRepositoryImpl();

export default userManagementRepository;
