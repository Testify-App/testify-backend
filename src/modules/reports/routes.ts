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
 *     summary: Report a post or comment
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
 *                 enum: [post, comment]
 *               entity_id:
 *                 type: string
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *               details:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Content reported successfully
 *       400:
 *         description: Already reported, or reporting own content
 *       404:
 *         description: Post or comment not found
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
 *           enum: [post, comment]
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
