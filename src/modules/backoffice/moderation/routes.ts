import { Router } from 'express';
import * as validator from './validator';
import moderationController from './controller';
import { WatchAsyncController } from '../../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../shared/middlewares/request-validator.middleware';
import {
  anyPermissionAccessValidator,
  permissionAccessValidator,
} from '../shared/middlewares/common.middleware';
import { protectedRoute } from '../shared/middlewares/protected-route.middleware';

/**
 * @swagger
 * tags:
 *   name: Backoffice Moderation
 *   description: Report queue, decisions and moderation statistics for the admin portal
 */

const moderationRouter = Router();

/**
 * @swagger
 * /backoffice/moderation/summary:
 *   get:
 *     summary: Report counts for the Overview page
 *     description: Pending, under review and resolved reports, and resolved reports where action was taken (content removed or an account action). Optional date range on the report date.
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *     responses:
 *       200:
 *         description: "{ pending, under_review, resolved, actions_taken }"
 */
moderationRouter.get(
  '/summary',
  ...protectedRoute,
  anyPermissionAccessValidator('overview:view', 'moderation:view'),
  validateDataMiddleware(validator.summaryQueryValidator, 'query'),
  WatchAsyncController(moderationController.summary),
);

/**
 * @swagger
 * /backoffice/moderation/reasons:
 *   get:
 *     summary: Report reasons with severity (the mobile app's list)
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ reasons: [{ code, label, severity }] }"
 */
moderationRouter.get(
  '/reasons',
  ...protectedRoute,
  anyPermissionAccessValidator('moderation:view', 'reports:view', 'users:view'),
  WatchAsyncController(moderationController.reasons),
);

/**
 * @swagger
 * /backoffice/moderation/moderators:
 *   get:
 *     summary: Admins who have reviewed or been assigned reports (moderator filter)
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ moderators: [{ id, name }] }"
 */
moderationRouter.get(
  '/moderators',
  ...protectedRoute,
  anyPermissionAccessValidator('moderation:view', 'reports:view'),
  WatchAsyncController(moderationController.moderators),
);

/**
 * @swagger
 * /backoffice/moderation/reports:
 *   get:
 *     summary: Report queue
 *     description: Reports on posts, comments, users and messages, newest first. Search matches report ID, content ID or a reporter / owner username.
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: page, schema: { type: string, default: '1' } }
 *       - { in: query, name: limit, schema: { type: string, default: '20' } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [pending, under_review, resolved] } }
 *       - { in: query, name: reason, schema: { type: string }, description: Reason code from /moderation/reasons }
 *       - { in: query, name: entity_type, schema: { type: string, enum: [post, comment, user, message] } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: moderator_id, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string, enum: [newest, oldest, severity] } }
 *     responses:
 *       200:
 *         description: "{ reports, total, currentPage, totalPages }"
 */
moderationRouter.get(
  '/reports',
  ...protectedRoute,
  anyPermissionAccessValidator('moderation:view', 'reports:view', 'overview:view'),
  validateDataMiddleware(validator.fetchReportsQueryValidator, 'query'),
  WatchAsyncController(moderationController.fetchReports),
);

/**
 * @swagger
 * /backoffice/moderation/reports/export:
 *   get:
 *     summary: Export reports as CSV
 *     description: Same filters as the report queue, without paging.
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 */
moderationRouter.get(
  '/reports/export',
  ...protectedRoute,
  anyPermissionAccessValidator('reports:export', 'moderation:export'),
  validateDataMiddleware(validator.exportReportsQueryValidator, 'query'),
  WatchAsyncController(moderationController.exportReports),
);

/**
 * @swagger
 * /backoffice/moderation/reports/{report_id}:
 *   get:
 *     summary: Report detail
 *     description: The report, the reported content (or user / message), reporter and owner summaries with their report counts, engagement and other reports on the same content.
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: report_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Report detail
 *       404:
 *         description: Report not found
 */
moderationRouter.get(
  '/reports/:report_id',
  ...protectedRoute,
  anyPermissionAccessValidator('moderation:view', 'reports:view'),
  validateDataMiddleware(validator.reportIdParamValidator, 'params'),
  WatchAsyncController(moderationController.fetchReportById),
);

/**
 * @swagger
 * /backoffice/moderation/reports/{report_id}/review:
 *   post:
 *     summary: Start reviewing a report
 *     description: Moves a pending report to under review and assigns it to the signed-in admin.
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: report_id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Updated report detail
 *       400:
 *         description: Already resolved
 */
moderationRouter.post(
  '/reports/:report_id/review',
  ...protectedRoute,
  permissionAccessValidator('moderation:update'),
  validateDataMiddleware(validator.reportIdParamValidator, 'params'),
  WatchAsyncController(moderationController.startReview),
);

/**
 * @swagger
 * /backoffice/moderation/reports/{report_id}/resolve:
 *   post:
 *     summary: Resolve a report
 *     description: |
 *       In one transaction: applies the decision, resolves every other open report on the same
 *       content and writes the audit log.
 *       - remove_content hides the post or comment (posts and comments only) and can notify the author.
 *       - account_action warns, suspends (duration_days, or null for indefinite) or bans the content owner;
 *         it also needs users:warn, users:update or users:ban respectively.
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: report_id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [no_action, remove_content, account_action] }
 *               account_action: { type: string, enum: [warning, suspend, ban] }
 *               duration_days: { type: integer, nullable: true, example: 7 }
 *               warning_template: { type: string, example: spam }
 *               notes: { type: string }
 *               notify: { type: boolean, default: true }
 *     responses:
 *       200:
 *         description: Updated report detail
 *       400:
 *         description: Already resolved, or the decision doesn't apply to this report
 *       403:
 *         description: Missing the permission for the account action
 */
moderationRouter.post(
  '/reports/:report_id/resolve',
  ...protectedRoute,
  permissionAccessValidator('moderation:update'),
  validateDataMiddleware(validator.reportIdParamValidator, 'params'),
  validateDataMiddleware(validator.resolveReportPayloadValidator, 'body'),
  WatchAsyncController(moderationController.resolveReport),
);

/**
 * @swagger
 * /backoffice/moderation/users/{user_id}/reports:
 *   get:
 *     summary: Reports submitted by a user (role=reporter) or made against them (role=owner)
 *     tags: [Backoffice Moderation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: user_id, required: true, schema: { type: string } }
 *       - { in: query, name: role, required: true, schema: { type: string, enum: [reporter, owner] } }
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ reports, total, currentPage, totalPages }"
 */
moderationRouter.get(
  '/users/:user_id/reports',
  ...protectedRoute,
  anyPermissionAccessValidator('moderation:view', 'users:view'),
  validateDataMiddleware(validator.userIdParamValidator, 'params'),
  validateDataMiddleware(validator.userReportsQueryValidator, 'query'),
  WatchAsyncController(moderationController.userReports),
);

export default moderationRouter;
