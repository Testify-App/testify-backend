import { RequestHandler, Router } from 'express';
import * as validator from './validator';
import controller from './controller';
import { WatchAsyncController } from '../../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../shared/middlewares/request-validator.middleware';
import { permissionAccessValidator } from '../shared/middlewares/common.middleware';
import { protectedRoute } from '../shared/middlewares/protected-route.middleware';
import { verifyAuthTokenMiddleware } from '../../../shared/middlewares/auth.middleware';

/**
 * @swagger
 * tags:
 *   - name: Backoffice Users
 *     description: App users in the admin portal — search, profile, standing, notes and warnings
 *   - name: Account Warnings
 *     description: App-side endpoints for the warned user to see and acknowledge warnings
 */

const userManagementRouter = Router();
const userParam = validateDataMiddleware(validator.userIdParamValidator, 'params');

/**
 * @swagger
 * /backoffice/users:
 *   get:
 *     summary: Search and filter app users
 *     description: |
 *       Search matches username, display name, name, email or exact user ID. status=restricted
 *       returns suspended and banned users with the latest restriction (reason, start, duration).
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: string } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, suspended, banned, restricted] } }
 *       - { in: query, name: flagged, schema: { type: boolean }, description: Only users with reports against them }
 *       - { in: query, name: joined_from, schema: { type: string, format: date } }
 *       - { in: query, name: joined_to, schema: { type: string, format: date } }
 *       - { in: query, name: sort, schema: { type: string, enum: [newest, oldest, username, last_login, reports, restricted_recent, restriction_type] } }
 *     responses:
 *       200:
 *         description: "{ users, total, currentPage, totalPages }"
 */
userManagementRouter.get(
  '/',
  ...protectedRoute,
  permissionAccessValidator('users:view'),
  validateDataMiddleware(validator.fetchUsersQueryValidator, 'query'),
  WatchAsyncController(controller.fetchUsers),
);

/**
 * @swagger
 * /backoffice/users/warning-templates:
 *   get:
 *     summary: Predefined warning messages
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ templates: [{ key, label, message }] }"
 */
userManagementRouter.get(
  '/warning-templates',
  ...protectedRoute,
  permissionAccessValidator('users:view'),
  WatchAsyncController(controller.warningTemplates),
);

/**
 * @swagger
 * /backoffice/users/{user_id}:
 *   get:
 *     summary: User profile with account statistics (read-only; the view is audited)
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Profile, standing and stats (posts, comments, likes, Tribe, Circle, communities, reports, warnings)
 *       404:
 *         description: User not found
 */
userManagementRouter.get(
  '/:user_id',
  ...protectedRoute,
  permissionAccessValidator('users:view'),
  userParam,
  WatchAsyncController(controller.fetchUserById),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/flagged-content:
 *   get:
 *     summary: The user's reported posts and comments, one row per item
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string, enum: [recent, severity, reports] } }
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ items, total, currentPage, totalPages }"
 */
userManagementRouter.get(
  '/:user_id/flagged-content',
  ...protectedRoute,
  permissionAccessValidator('users:view'),
  userParam,
  validateDataMiddleware(validator.flaggedContentQueryValidator, 'query'),
  WatchAsyncController(controller.fetchFlaggedContent),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/moderation-history:
 *   get:
 *     summary: Suspensions, bans, reinstatements and warnings, newest first
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ history: [{ kind, reason, note, duration_days, ends_at, performed_by, created_at, ... }] }"
 */
userManagementRouter.get(
  '/:user_id/moderation-history',
  ...protectedRoute,
  permissionAccessValidator('users:view'),
  userParam,
  WatchAsyncController(controller.fetchModerationHistory),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/suspend:
 *   post:
 *     summary: Suspend a user (duration_days, or null for indefinite)
 *     description: Takes effect on the user's next request; their open sockets are closed.
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [duration_days]
 *             properties:
 *               duration_days: { type: integer, nullable: true, example: 7 }
 *               reason_code: { type: string, example: spam }
 *               reason: { type: string }
 *               note: { type: string }
 *               notify: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: "{ user_id, moderation_status, suspended_until }"
 *       400:
 *         description: Already suspended or banned
 */
userManagementRouter.post(
  '/:user_id/suspend',
  ...protectedRoute,
  permissionAccessValidator('users:update'),
  userParam,
  validateDataMiddleware(validator.suspendPayloadValidator, 'body'),
  WatchAsyncController(controller.suspend),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/suspension:
 *   patch:
 *     summary: Change the length of a current suspension (from now)
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ user_id, moderation_status, suspended_until }"
 */
userManagementRouter.patch(
  '/:user_id/suspension',
  ...protectedRoute,
  permissionAccessValidator('users:update'),
  userParam,
  validateDataMiddleware(validator.suspendPayloadValidator, 'body'),
  WatchAsyncController(controller.extendSuspension),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/ban:
 *   post:
 *     summary: Permanently ban a user
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ user_id, moderation_status: banned }"
 */
userManagementRouter.post(
  '/:user_id/ban',
  ...protectedRoute,
  permissionAccessValidator('users:ban'),
  userParam,
  validateDataMiddleware(validator.banPayloadValidator, 'body'),
  WatchAsyncController(controller.ban),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/reinstate:
 *   post:
 *     summary: Lift a suspension (bans can't be lifted)
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ user_id, moderation_status: active }"
 */
userManagementRouter.post(
  '/:user_id/reinstate',
  ...protectedRoute,
  permissionAccessValidator('users:update'),
  userParam,
  validateDataMiddleware(validator.reinstatePayloadValidator, 'body'),
  WatchAsyncController(controller.reinstate),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/notes:
 *   get:
 *     summary: Internal moderator notes (never shown to the user)
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ notes: [{ id, body, tag, author, created_at, updated_at }] }"
 *   post:
 *     summary: Add a note
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body: { type: string }
 *               tag: { type: string, enum: [warning, positive, neutral, pending_review] }
 *     responses:
 *       201:
 *         description: Updated notes list
 */
userManagementRouter.get(
  '/:user_id/notes',
  ...protectedRoute,
  permissionAccessValidator('users:view'),
  userParam,
  WatchAsyncController(controller.fetchNotes),
);
userManagementRouter.post(
  '/:user_id/notes',
  ...protectedRoute,
  permissionAccessValidator('users:update'),
  userParam,
  validateDataMiddleware(validator.notePayloadValidator, 'body'),
  WatchAsyncController(controller.createNote),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/notes/{note_id}:
 *   patch:
 *     summary: Edit a note (author only, unless root)
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *       - { in: path, name: note_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Updated notes list
 *       403:
 *         description: Not the author
 *   delete:
 *     summary: Delete a note (author only, unless root)
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *       - { in: path, name: note_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Updated notes list
 */
userManagementRouter.patch(
  '/:user_id/notes/:note_id',
  ...protectedRoute,
  permissionAccessValidator('users:update'),
  validateDataMiddleware(validator.noteParamValidator, 'params'),
  validateDataMiddleware(validator.notePayloadValidator, 'body'),
  WatchAsyncController(controller.updateNote),
);
userManagementRouter.delete(
  '/:user_id/notes/:note_id',
  ...protectedRoute,
  permissionAccessValidator('users:update'),
  validateDataMiddleware(validator.noteParamValidator, 'params'),
  WatchAsyncController(controller.deleteNote),
);

/**
 * @swagger
 * /backoffice/users/{user_id}/warnings:
 *   post:
 *     summary: Send a formal warning (template or custom message)
 *     description: Delivered as an in-app moderation notification (plus push, and email if send_email). The user acknowledges it from the app.
 *     tags: [Backoffice Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_key: { type: string, example: spam }
 *               message: { type: string }
 *               send_email: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: "{ id }"
 */
userManagementRouter.post(
  '/:user_id/warnings',
  ...protectedRoute,
  permissionAccessValidator('users:warn'),
  userParam,
  validateDataMiddleware(validator.warningPayloadValidator, 'body'),
  WatchAsyncController(controller.sendWarning),
);

// ---- App side: mounted at /api/v1/account ------------------------------------------------------

export const accountWarningsRouter = Router();
const appAuth = verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * /account/warnings/pending:
 *   get:
 *     summary: Warnings the signed-in user hasn't acknowledged yet (show on next login)
 *     tags: [Account Warnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ warnings: [{ id, message, template_key, created_at }] }"
 */
accountWarningsRouter.get('/warnings/pending', appAuth, WatchAsyncController(controller.pendingWarnings));

/**
 * @swagger
 * /account/warnings/{warning_id}/acknowledge:
 *   post:
 *     summary: Acknowledge a warning
 *     tags: [Account Warnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: warning_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Acknowledged
 *       404:
 *         description: Not found or already acknowledged
 */
accountWarningsRouter.post(
  '/warnings/:warning_id/acknowledge',
  appAuth,
  validateDataMiddleware(validator.warningIdParamValidator, 'params'),
  WatchAsyncController(controller.acknowledgeWarning),
);

export default userManagementRouter;
