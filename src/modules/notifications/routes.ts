import { Router, RequestHandler } from 'express';
import * as notificationsValidator from './validator';
import notificationsController from './controller';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

const notificationsRouter = Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get paginated notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [all, mentions, likes, comments, circle_requests, follows, moderation]
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
notificationsRouter.get(
  '/',
  verifyAuth,
  validateDataMiddleware(notificationsValidator.getNotificationsQueryValidator, 'query'),
  WatchAsyncController(notificationsController.getNotifications)
);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get the number of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
notificationsRouter.get(
  '/unread-count',
  verifyAuth,
  WatchAsyncController(notificationsController.getUnreadCount)
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
notificationsRouter.patch(
  '/read-all',
  verifyAuth,
  WatchAsyncController(notificationsController.markAllAsRead)
);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
notificationsRouter.patch(
  '/:notificationId/read',
  verifyAuth,
  validateDataMiddleware(notificationsValidator.notificationIdParamsValidator, 'params'),
  WatchAsyncController(notificationsController.markAsRead)
);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
notificationsRouter.delete(
  '/:notificationId',
  verifyAuth,
  validateDataMiddleware(notificationsValidator.notificationIdParamsValidator, 'params'),
  WatchAsyncController(notificationsController.deleteNotification)
);

export default notificationsRouter;
