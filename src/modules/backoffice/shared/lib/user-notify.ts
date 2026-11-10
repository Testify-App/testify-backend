import { db } from '../../../../config/database';
import NotificationService from '../../../../shared/services/notification';
import { sendEmail } from '../../../../shared/lib/email';
import logger from '../../../../shared/services/logger';
import userModerationEmailTemplate from './email/templates/user.moderation';
import { Queryable } from './db';

/**
 * Moderation notices to app users. The mobile app already renders any notification whose type
 * contains "moderation", showing data.reason or data.message.
 */
export type ModerationNoticeType =
  | 'moderation_warning'
  | 'moderation_suspended'
  | 'moderation_banned'
  | 'moderation_reinstated'
  | 'moderation_content_removed';

export interface ModerationNotice {
  userId: string;
  type: ModerationNoticeType;
  /** Push title and email subject. */
  title: string;
  /** One-line text for the notification list and push body. */
  message: string;
  /** Extra paragraphs for the email. */
  details?: string[];
  entityType?: string | null;
  entityId?: string | null;
  data?: Record<string, unknown>;
  email: boolean;
}

/** Inserts the in-app notification (no actor: it comes from Testify). Run inside the transaction. */
export const recordNotice = async (t: Queryable, notice: ModerationNotice): Promise<string> => {
  const row = await t.one(
    `INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, data)
     VALUES ($1, NULL, $2, $3, $4, $5) RETURNING id;`,
    [
      notice.userId,
      notice.type,
      notice.entityType ?? 'user',
      notice.entityId ?? notice.userId,
      JSON.stringify({ ...notice.data, title: notice.title, message: notice.message, reason: notice.message }),
    ],
  );
  return row.id;
};

/** Push and email, after the transaction commits. Best effort: failures are logged, not thrown. */
export const deliverNotice = async (notice: ModerationNotice): Promise<void> => {
  const user = await db.oneOrNone(
    'SELECT email, fcm_token, first_name, username FROM users WHERE id = $1;',
    [notice.userId],
  );
  if (!user) return;
  if (user.fcm_token) {
    try {
      await NotificationService.sendToDevice(user.fcm_token, notice.title, notice.message, {
        type: notice.type,
        entity_type: `${notice.entityType ?? 'user'}`,
        entity_id: `${notice.entityId ?? notice.userId}`,
      });
    } catch (error) {
      logger.error(`moderation push failed: ${error}`, 'user-notify.ts');
    }
  }
  if (notice.email && user.email) {
    try {
      await sendEmail({
        to: user.email,
        subject: notice.title,
        html: userModerationEmailTemplate({
          title: notice.title,
          name: user.first_name || user.username || '',
          paragraphs: [notice.message, ...(notice.details ?? [])],
        }),
      });
    } catch (error) {
      logger.error(`moderation email failed: ${error}`, 'user-notify.ts');
    }
  }
};
