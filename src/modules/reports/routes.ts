import { Router, RequestHandler } from 'express';
import * as reportsValidator from './validator';
import reportsController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { verifyAdminMiddleware } from '../../shared/middlewares/admin.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;
const verifyAdmin: RequestHandler = verifyAdminMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Content reporting and moderation endpoints
 */

const reportsRouter = Router();

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Report a post, comment, message, or user
 *     description: >
 *       For entity_type "user", entity_id is the reported user's own id. Pass
 *       context_conversation_id when reporting a user from within a DM conversation
 *       so moderators can pull the relevant message history — the reporter must
 *       actually be a participant in that conversation. Reporting never notifies
 *       the reported user, never blocks them, and never deletes anything; the same
 *       (entity_type, entity_id, reporter) combination can only be reported once.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entity_type
 *               - entity_id
 *               - reason
 *             properties:
 *               entity_type:
 *                 type: string
 *                 enum: [post, comment, message, user]
 *               entity_id:
 *                 type: string
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *               details:
 *                 type: string
 *                 maxLength: 1000
 *               context_conversation_id:
 *                 type: string
 *                 description: Only meaningful for entity_type "user" when reporting from a DM conversation.
 *     responses:
 *       201:
 *         description: Report submitted. Thank you for helping keep Testify safe.
 *       400:
 *         description: Already reported, reporting your own content/yourself, or not a participant in the cited conversation
 *       404:
 *         description: Post, comment, message, or user not found
 */
reportsRouter.post(
  '/',
  verifyAuth,
  validateDataMiddleware(reportsValidator.createReportValidator, 'body'),
  WatchAsyncController(reportsController.createReport)
);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get the moderation queue (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, under_review, resolved]
 *       - name: entity_type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [post, comment, message, user]
 *       - name: page
 *         in: query
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
 *       403:
 *         description: Admin access required
 */
reportsRouter.get(
  '/',
  verifyAuth,
  verifyAdmin,
  validateDataMiddleware(reportsValidator.getReportsQueryValidator, 'query'),
  WatchAsyncController(reportsController.getReports)
);

/**
 * @swagger
 * /reports/{reportId}:
 *   patch:
 *     summary: Review a report and record a moderator action (admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, under_review, resolved]
 *               moderator_action:
 *                 type: string
 *                 enum: [no_action, content_removed, user_action_taken]
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Report not found
 */
reportsRouter.patch(
  '/:reportId',
  verifyAuth,
  verifyAdmin,
  validateDataMiddleware(reportsValidator.reportIdValidator, 'params'),
  validateDataMiddleware(reportsValidator.reviewReportValidator, 'body'),
  WatchAsyncController(reportsController.reviewReport)
);

export default reportsRouter;
