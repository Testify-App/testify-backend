import { Router } from 'express';
import * as validator from './validator';
import controller from './controller';
import { WatchAsyncController } from '../../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../shared/middlewares/request-validator.middleware';
import { permissionAccessValidator } from '../shared/middlewares/common.middleware';
import { protectedRoute } from '../shared/middlewares/protected-route.middleware';

/**
 * @swagger
 * tags:
 *   name: Backoffice Hidden Content
 *   description: Posts and comments removed by moderators
 */

const hiddenContentRouter = Router();

/**
 * @swagger
 * /backoffice/hidden-content:
 *   get:
 *     summary: Hidden posts or comments, most recently hidden first
 *     tags: [Backoffice Hidden Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: type, schema: { type: string, enum: [post, comment], default: post } }
 *       - { in: query, name: search, schema: { type: string }, description: Content ID, text or author username }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ items, counts: { posts, comments }, total, currentPage, totalPages }"
 */
hiddenContentRouter.get(
  '/',
  ...protectedRoute,
  permissionAccessValidator('hidden:view'),
  validateDataMiddleware(validator.fetchHiddenQueryValidator, 'query'),
  WatchAsyncController(controller.fetchHidden),
);

/**
 * @swagger
 * /backoffice/hidden-content/{type}/{content_id}/restore:
 *   post:
 *     summary: Restore hidden content
 *     description: Only content hidden by moderation can be restored; an author's own deletion can't.
 *     tags: [Backoffice Hidden Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: type, required: true, schema: { type: string, enum: [post, comment] } }
 *       - { in: path, name: content_id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Restored
 *       404:
 *         description: Not hidden
 */
hiddenContentRouter.post(
  '/:type/:content_id/restore',
  ...protectedRoute,
  permissionAccessValidator('hidden:update'),
  validateDataMiddleware(validator.contentParamValidator, 'params'),
  validateDataMiddleware(validator.restorePayloadValidator, 'body'),
  WatchAsyncController(controller.restore),
);

export default hiddenContentRouter;
