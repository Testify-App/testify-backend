import { verifyAuthTokenMiddleware } from './auth.middleware';
import { backofficeAccountAccessValidator, roleAccessValidator } from './common.middleware';

// A signed-in admin with a live session (not suspended, not idle, not superseded).
export const sessionRoute = [verifyAuthTokenMiddleware, backofficeAccountAccessValidator];

// ...who also holds an active role. Add `permissionAccessValidator(key)` after it for per-action checks.
export const protectedRoute = [...sessionRoute, roleAccessValidator];
