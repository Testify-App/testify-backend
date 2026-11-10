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
 *   name: Backoffice Audit Log
 *   description: Every admin-portal action, newest first
 */

const auditLogRouter = Router();

/**
 * @swagger
 * /backoffice/audit-logs:
 *   get:
 *     summary: Audit log entries
 *     description: category=moderation covers moderation, users and hidden content; category=admin covers sign-in, roles and staff; category=views covers member profile views.
 *     tags: [Backoffice Audit Log]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Target ID, target username, or admin name / email }
 *       - { in: query, name: action, schema: { type: string } }
 *       - { in: query, name: actor_id, schema: { type: string } }
 *       - { in: query, name: entity_type, schema: { type: string, enum: [post, comment, user, report, role, admin] } }
 *       - { in: query, name: category, schema: { type: string, enum: [moderation, admin, views] } }
 *       - { in: query, name: from, schema: { type: string, format: date } }
 *       - { in: query, name: to, schema: { type: string, format: date } }
 *       - { in: query, name: page, schema: { type: string } }
 *       - { in: query, name: limit, schema: { type: string } }
 *     responses:
 *       200:
 *         description: "{ entries: [{ action, action_label, actor, target, reason, ip, created_at }], total, currentPage, totalPages }"
 */
auditLogRouter.get(
  '/',
  ...protectedRoute,
  permissionAccessValidator('audit:view'),
  validateDataMiddleware(validator.fetchLogsQueryValidator, 'query'),
  WatchAsyncController(controller.fetchLogs),
);

/**
 * @swagger
 * /backoffice/audit-logs/filters:
 *   get:
 *     summary: Choices for the action, admin and category filters
 *     tags: [Backoffice Audit Log]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "{ actions: [{ value, label }], actors: [{ id, name }], categories }"
 */
auditLogRouter.get(
  '/filters',
  ...protectedRoute,
  permissionAccessValidator('audit:view'),
  WatchAsyncController(controller.filters),
);

/**
 * @swagger
 * /backoffice/audit-logs/export:
 *   get:
 *     summary: Export the audit log as CSV (same filters, no paging)
 *     tags: [Backoffice Audit Log]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 */
auditLogRouter.get(
  '/export',
  ...protectedRoute,
  permissionAccessValidator('audit:export'),
  validateDataMiddleware(validator.exportLogsQueryValidator, 'query'),
  WatchAsyncController(controller.exportLogs),
);

export default auditLogRouter;
