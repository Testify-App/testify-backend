import { db } from '../../config/database';
import redisService from './redis';
import logger from './logger';

/**
 * Whether an app user may use the platform, as set by the admin portal (Users / Moderation).
 * Checked on every signed-in request and socket connection because app tokens never expire,
 * so a suspension or ban has to take effect without waiting for the user to sign in again.
 */
export type ModerationStatus = 'active' | 'suspended' | 'banned';
export interface AccountStanding {
  status: ModerationStatus;
  /** End of a suspension; null for an indefinite suspension. */
  until: string | null;
}

const CACHE_SECONDS = 60;
const cacheKey = (userId: string) => `account-standing:${userId}`;
const ACTIVE: AccountStanding = { status: 'active', until: null };

/** Applies expiry: a suspension whose end has passed counts as lifted straight away. */
export const effectiveStanding = (
  row: { moderation_status?: string | null; suspended_until?: Date | string | null } | null | undefined,
): AccountStanding => {
  if (!row || !row.moderation_status || row.moderation_status === 'active') return ACTIVE;
  if (row.moderation_status === 'banned') return { status: 'banned', until: null };
  const until = row.suspended_until ? new Date(row.suspended_until) : null;
  if (until && until.getTime() <= Date.now()) return ACTIVE;
  return { status: 'suspended', until: until ? until.toISOString() : null };
};

export const getAccountStanding = async (userId: string): Promise<AccountStanding> => {
  try {
    const cached = await redisService.get(cacheKey(userId));
    if (cached && typeof cached === 'object' && 'status' in cached) {
      const value = cached as AccountStanding;
      return effectiveStanding({ moderation_status: value.status, suspended_until: value.until });
    }
  } catch (error) {
    logger.error(`account standing cache read failed: ${error}`, 'account-standing.ts');
  }
  const row = await db.oneOrNone(
    'SELECT moderation_status, suspended_until FROM users WHERE id = $1;',
    [userId],
  );
  const raw: AccountStanding = row
    ? {
      status: row.moderation_status ?? 'active',
      until: row.suspended_until ? new Date(row.suspended_until).toISOString() : null,
    }
    : ACTIVE;
  try {
    await redisService.add({ key: cacheKey(userId), value: raw, expiresIn: CACHE_SECONDS });
  } catch (error) {
    logger.error(`account standing cache write failed: ${error}`, 'account-standing.ts');
  }
  return effectiveStanding({ moderation_status: raw.status, suspended_until: raw.until });
};

/** Call after any change to a user's standing so it applies on their next request. */
export const clearAccountStanding = async (userId: string): Promise<void> => {
  try {
    await redisService.delete(cacheKey(userId));
  } catch (error) {
    logger.error(`account standing cache clear failed: ${error}`, 'account-standing.ts');
  }
};

const formatDate = (iso: string) => new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
}).format(new Date(iso)) + ' UTC';

export const standingMessage = (standing: AccountStanding): string => {
  if (standing.status === 'banned') {
    return 'Your account has been permanently banned for violating the community guidelines.';
  }
  return standing.until
    ? `Your account is suspended until ${formatDate(standing.until)}.`
    : 'Your account has been suspended. Contact support for assistance.';
};

/** 403 body the mobile app recognises by `code` (ACCOUNT_SUSPENDED / ACCOUNT_BANNED). */
export const standingErrorBody = (standing: AccountStanding) => ({
  status: 'error',
  statusCode: 403,
  code: standing.status === 'banned' ? 'ACCOUNT_BANNED' : 'ACCOUNT_SUSPENDED',
  message: standingMessage(standing),
  data: { status: standing.status, until: standing.until },
});
