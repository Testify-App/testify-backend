import { Router } from 'express';
import * as searchValidator from './validator';
import searchController from './controller';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Unified full-text search across posts, profiles, and hashtags
 */

const searchRouter = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search posts, profiles, and hashtags
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search keyword or phrase
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     query:
 *                       type: string
 *                     page:
 *                       type: string
 *                     limit:
 *                       type: string
 *                     posts:
 *                       type: object
 *                       properties:
 *                         results:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Post'
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                     profiles:
 *                       type: object
 *                       properties:
 *                         results:
 *                           type: array
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                     hashtags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tag:
 *                             type: string
 *                           posts_count:
 *                             type: integer
 *       400:
 *         description: Bad request — missing or invalid query
 */
searchRouter.get(
  '/',
  validateDataMiddleware(searchValidator.searchQueryValidator, 'query'),
  WatchAsyncController(searchController.search)
);

export default searchRouter;
