import { db } from '../../../../config/database';
import {
  AccountStanding,
  clearAccountStanding,
  effectiveStanding,
} from '../../../../shared/services/account-standing';
import { disconnectUser } from '../../../../shared/sockets/messaging.gateway';
import { writeAudit } from './audit';
import { Queryable } from './db';
import { BadException, NotFoundException } from './errors';
import { ActorContext } from './request-context';
import { ModerationNotice, deliverNotice, recordNotice } from './user-notify';

/**
 * Suspensions, bans, reinstatements and warnings for app users. Shared by the Users and
 * Moderation modules so a decision has the same effect wherever it is taken.
 *
 * Call the transactional function inside db.tx, then `afterStandingChange` once it commits:
 * that clears the cached standing (so the next request is blocked or allowed), drops live
 * sockets and sends the push / email.
 */

export type StandingAction = 'suspend' | 'ban' | 'reinstate' | 'extend';

export interface StandingChangeInput {
  userId: string;
  action: StandingAction;
  /** Suspension length in days; null or undefined means indefinite. */
  durationDays?: number | null;
  reasonCode?: string | null;
  reason?: string | null;
  note?: string | null;
  notify: boolean;
  reportId?: string | null;
  actor: ActorContext;
  /** Audit module: the screen the action was taken from. */
  module: 'users' | 'moderation';
}

export interface StandingChangeResult {
  userId: string;
  actionId: string;
  standing: AccountStanding;
  notice: ModerationNotice | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const reasonText = (reason: string | null | undefined) => (reason?.trim() ? reason.trim() : null);

const formatUntil = (iso: string) => new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long', timeZone: 'UTC',
}).format(new Date(iso));

const noticeFor = (
  input: StandingChangeInput, standing: AccountStanding,
): ModerationNotice | null => {
  if (!input.notify) return null;
  const reason = reasonText(input.reason);
  const because = reason ? ` Reason: ${reason}` : '';
  switch (input.action) {
    case 'suspend':
    case 'extend':
      return {
        userId: input.userId,
        type: 'moderation_suspended',
        title: 'Your Testify account has been suspended',
        message: (standing.until
          ? `Your account is suspended until ${formatUntil(standing.until)}.`
          : 'Your account has been suspended until further notice.') + because,
        data: { until: standing.until },
        email: true,
      };
    case 'ban':
      return {
        userId: input.userId,
        type: 'moderation_banned',
        title: 'Your Testify account has been banned',
        message: `Your account has been permanently banned for violating the community guidelines.${because}`,
        email: true,
      };
    case 'reinstate':
      return {
        userId: input.userId,
        type: 'moderation_reinstated',
        title: 'Your Testify account has been reinstated',
        message: 'Your account has been reinstated. Please ensure compliance with our community guidelines going forward.',
        email: true,
      };
    default:
      return null;
  }
};

export const changeStanding = async (
  t: Queryable, input: StandingChangeInput,
): Promise<StandingChangeResult> => {
  const user = await t.oneOrNone(
    `SELECT id, moderation_status, suspended_until FROM users
     WHERE id = $1 AND deleted_at IS NULL FOR UPDATE;`,
    [input.userId],
  );
  if (!user) throw new NotFoundException('User not found.');
  const before = effectiveStanding(user);
  const days = input.durationDays ?? null;
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) {
    throw new BadException('Choose a suspension length between 1 and 3650 days, or indefinite.');
  }
  const until = days === null ? null : new Date(Date.now() + days * DAY_MS).toISOString();

  let after: AccountStanding;
  switch (input.action) {
    case 'suspend':
      if (before.status === 'banned') throw new BadException('This user is banned. A ban cannot be changed to a suspension.');
      if (before.status === 'suspended') throw new BadException('This user is already suspended. Extend the suspension instead.');
      after = { status: 'suspended', until };
      break;
    case 'extend':
      if (before.status !== 'suspended') throw new BadException('Only a current suspension can be extended.');
      after = { status: 'suspended', until };
      break;
    case 'ban':
      if (before.status === 'banned') throw new BadException('This user is already banned.');
      after = { status: 'banned', until: null };
      break;
    case 'reinstate':
      if (before.status === 'banned') throw new BadException('Bans are permanent and cannot be lifted.');
      if (before.status === 'active') throw new BadException('This user is not suspended.');
      after = { status: 'active', until: null };
      break;
    default:
      throw new BadException('Unknown action.');
  }

  await t.none(
    `UPDATE users SET moderation_status = $2, suspended_until = $3, moderation_updated_at = NOW()
     WHERE id = $1;`,
    [input.userId, after.status, after.until],
  );
  const action = await t.one(
    `INSERT INTO user_moderation_actions (
       user_id, action, reason_code, reason, note, duration_days, ends_at,
       performed_by_admin_id, report_id, notified
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;`,
    [
      input.userId, input.action, input.reasonCode ?? null, reasonText(input.reason), reasonText(input.note),
      input.action === 'suspend' || input.action === 'extend' ? days : null,
      after.until, input.actor.adminId, input.reportId ?? null, input.notify,
    ],
  );
  await writeAudit(t, {
    actorId: input.actor.adminId,
    action: `user:${input.action}`,
    module: input.module,
    entityType: 'user',
    entityReference: input.userId,
    before: { status: before.status, until: before.until },
    after: {
      status: after.status,
      until: after.until,
      reason: reasonText(input.reason),
      reason_code: input.reasonCode ?? null,
      duration_days: days,
      report_id: input.reportId ?? null,
    },
    ip: input.actor.ip,
  });
  const notice = noticeFor(input, after);
  if (notice) await recordNotice(t, notice);
  return { userId: input.userId, actionId: action.id, standing: after, notice };
};

// ---- Warnings ------------------------------------------------------------------------------

export const WARNING_TEMPLATES = [
  {
    key: 'spam',
    label: 'Spam',
    message: 'We noticed repeated promotional or repetitive content from your account. Please keep your testimonies and comments genuine and relevant.',
  },
  {
    key: 'hate_speech',
    label: 'Hate speech',
    message: 'Content you shared was reported as hateful toward a person or group. Testify does not allow hate speech; further violations may lead to suspension.',
  },
  {
    key: 'harassment',
    label: 'Harassment',
    message: 'Your interactions with other members were reported as harassment or bullying. Please treat everyone with respect; further violations may lead to suspension.',
  },
  {
    key: 'misleading',
    label: 'Misleading content',
    message: 'Content you shared was found to be false or misleading. Please make sure what you post is accurate.',
  },
  {
    key: 'off_topic',
    label: 'Off-topic posts',
    message: 'Some of your recent posts were off-topic for the community. Please keep your content relevant to the spaces you post in.',
  },
  {
    key: 'inappropriate',
    label: 'Inappropriate content',
    message: 'Content you shared breaks our community guidelines on sensitive or explicit material. Please review the guidelines before posting again.',
  },
] as const;

export interface WarningInput {
  userId: string;
  templateKey?: string | null;
  message?: string | null;
  sendEmail: boolean;
  reportId?: string | null;
  actor: ActorContext;
  module: 'users' | 'moderation';
}

export interface WarningResult {
  warningId: string;
  notice: ModerationNotice;
}

export const sendWarning = async (t: Queryable, input: WarningInput): Promise<WarningResult> => {
  const user = await t.oneOrNone('SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL;', [input.userId]);
  if (!user) throw new NotFoundException('User not found.');
  const template = WARNING_TEMPLATES.find((item) => item.key === input.templateKey);
  if (input.templateKey && !template) throw new BadException('Unknown warning template.');
  const message = reasonText(input.message) ?? template?.message ?? null;
  if (!message) throw new BadException('Choose a warning template or write a message.');
  if (message.length > 1000) throw new BadException('Keep the warning under 1000 characters.');

  const notice: ModerationNotice = {
    userId: input.userId,
    type: 'moderation_warning',
    title: 'A warning about your Testify account',
    message,
    email: input.sendEmail,
  };
  const notificationId = await recordNotice(t, notice);
  const warning = await t.one(
    `INSERT INTO user_warnings (user_id, template_key, message, sent_by_admin_id, report_id, notification_id, emailed)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`,
    [input.userId, template?.key ?? null, message, input.actor.adminId, input.reportId ?? null, notificationId, input.sendEmail],
  );
  // The notification carries the warning id so the app can acknowledge it.
  await t.none(
    `UPDATE notifications SET data = data || jsonb_build_object('warning_id', $2::text), entity_type = 'warning', entity_id = $2
     WHERE id = $1;`,
    [notificationId, warning.id],
  );
  await writeAudit(t, {
    actorId: input.actor.adminId,
    action: 'user:warn',
    module: input.module,
    entityType: 'user',
    entityReference: input.userId,
    after: { warning_id: warning.id, template: template?.key ?? 'custom', message, report_id: input.reportId ?? null },
    ip: input.actor.ip,
  });
  return { warningId: warning.id, notice };
};

/** Side effects once the transaction has committed. */
export const afterStandingChange = async (result: { userId: string; standing?: AccountStanding; notice: ModerationNotice | null }) => {
  if (result.standing) {
    await clearAccountStanding(result.userId);
    if (result.standing.status !== 'active') disconnectUser(result.userId);
  }
  if (result.notice) await deliverNotice(result.notice);
};

/**
 * Lifts suspensions whose end date has passed (they already stopped blocking access when they
 * expired; this records it and tells the user). Run by the suspension-expiry job.
 */
export const expireSuspensions = async (): Promise<number> => {
  const expired = await db.tx(async (t) => {
    const rows = await t.manyOrNone(
      `UPDATE users SET moderation_status = 'active', suspended_until = NULL, moderation_updated_at = NOW()
       WHERE moderation_status = 'suspended' AND suspended_until IS NOT NULL AND suspended_until <= NOW()
       RETURNING id;`,
    );
    const notices: ModerationNotice[] = [];
    for (const row of rows) {
      await t.none(
        `INSERT INTO user_moderation_actions (user_id, action, reason, performed_by_admin_id, notified)
         VALUES ($1, 'expire', 'Suspension period ended', NULL, TRUE);`,
        [row.id],
      );
      await writeAudit(t, {
        actorId: null,
        action: 'user:auto_reinstate',
        module: 'users',
        entityType: 'user',
        entityReference: row.id,
        after: { status: 'active', reason: 'Suspension period ended' },
      });
      const notice: ModerationNotice = {
        userId: row.id,
        type: 'moderation_reinstated',
        title: 'Your Testify account has been reinstated',
        message: 'Your suspension has ended and your account is active again. Please ensure compliance with our community guidelines going forward.',
        email: false,
      };
      await recordNotice(t, notice);
      notices.push(notice);
    }
    return notices;
  });
  for (const notice of expired) {
    await clearAccountStanding(notice.userId);
    await deliverNotice(notice);
  }
  return expired.length;
};
