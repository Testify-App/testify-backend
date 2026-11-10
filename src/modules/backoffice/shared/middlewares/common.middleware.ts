import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../../../config/database';
import { User } from '../../../../shared/interface';
import Env from '../../../../shared/utils/env';
import { adminHasPermission } from '../lib/permissions';

// Every check below re-queries the database on each request rather than trusting
// JWT claims (beyond id/session_id). Suspending an admin, deactivating a role or editing
// role permissions takes effect on the very next request, without logout or token refresh.

const DEFAULT_SESSION_IDLE_MINUTES = 30;
// Avoid a write on every request: last_activity_at only moves when it is this stale.
const ACTIVITY_TOUCH_INTERVAL_SECONDS = 60;

const sessionIdleMinutes = (): number => {
  const minutes = Number(Env.get<string>('SESSION_IDLE_MINUTES'));
  return Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_SESSION_IDLE_MINUTES;
};

const unauthorized = (res: Response, message: string) => res.status(StatusCodes.UNAUTHORIZED).json({
  status: 'error',
  statusCode: StatusCodes.UNAUTHORIZED,
  message,
});

const forbidden = (res: Response, message: string) => res.status(StatusCodes.FORBIDDEN).json({
  status: 'error',
  statusCode: StatusCodes.FORBIDDEN,
  message,
});

export const backofficeAccountAccessValidator = async (
  req: Request, res: Response, next: NextFunction,
) => {
  const user = (req as any).user as User;
  const admin = await db.oneOrNone(
    `SELECT status, session_id, role_id, is_root_account, first_name, last_name,
       (last_activity_at IS NOT NULL AND last_activity_at < NOW() - make_interval(mins => $2)) AS is_idle,
       (last_activity_at IS NULL OR last_activity_at < NOW() - make_interval(secs => $3)) AS needs_touch
     FROM admins WHERE id = $1 AND deleted_at IS NULL;`,
    [user.id, sessionIdleMinutes(), ACTIVITY_TOUCH_INTERVAL_SECONDS],
  );
  if (!admin) {
    return unauthorized(res, 'Invalid or expired session.');
  }
  if (admin.status === 'deactivated') {
    return unauthorized(res, 'Your account has been suspended. Contact your administrator.');
  }
  // A newer login or a logout replaces/clears session_id, ending this token.
  if (!user.session_id || admin.session_id !== user.session_id) {
    return unauthorized(res, 'Your session has ended. Please sign in again.');
  }
  if (admin.is_idle) {
    await db.none('UPDATE admins SET session_id = NULL WHERE id = $1 AND session_id = $2;', [user.id, user.session_id]);
    return unauthorized(res, 'Your session expired due to inactivity. Please sign in again.');
  }
  if (admin.needs_touch) {
    await db.none('UPDATE admins SET last_activity_at = NOW() WHERE id = $1;', [user.id]);
  }
  // Role and name changes apply immediately: later checks use the current values, not the token's.
  (req as any).user = {
    ...user,
    role_id: admin.role_id,
    is_root_account: admin.is_root_account,
    first_name: admin.first_name,
    last_name: admin.last_name,
  };
  return next();
};

export const roleAccessValidator = async (
  req: Request, res: Response, next: NextFunction,
) => {
  const { role_id, is_root_account } = (req as any).user as User;
  if (is_root_account) {
    return next();
  }
  if (!role_id) {
    return forbidden(res, 'No role assigned to this account.');
  }
  const role = await db.oneOrNone(
    'SELECT is_active FROM roles WHERE id = $1 AND is_deleted = FALSE;',
    [role_id],
  );
  if (!role || !role.is_active) {
    return forbidden(res, 'Your role has been deactivated. Contact your administrator.');
  }
  return next();
};

export const permissionAccessValidator = (permission: string) => async (
  req: Request, res: Response, next: NextFunction,
) => {
  const { role_id, is_root_account } = (req as any).user as User;
  if (is_root_account || await adminHasPermission(role_id, permission)) {
    return next();
  }
  return forbidden(res, 'You do not have permission to access this resource.');
};

/** Passes when the admin holds at least one of `permissions` (e.g. a page shared by two modules). */
export const anyPermissionAccessValidator = (...permissions: string[]) => async (
  req: Request, res: Response, next: NextFunction,
) => {
  const { role_id, is_root_account } = (req as any).user as User;
  if (is_root_account) return next();
  for (const permission of permissions) {
    if (await adminHasPermission(role_id, permission)) return next();
  }
  return forbidden(res, 'You do not have permission to access this resource.');
};
