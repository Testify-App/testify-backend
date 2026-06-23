import { Router, RequestHandler } from 'express';
import * as hashtagsValidator from './validator';
import hashtagsController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const optionalAuth: RequestHandler = (AuthenticationMiddleware as any).optionalAuthTokenMiddleware
  ? (AuthenticationMiddleware as any).optionalAuthTokenMiddleware as RequestHandler
  : (_req, _res, next) => next();

/**
 * @swagger
 * tags:
 *   name: Hashtags
 *   description: Hashtag discovery and search endpoints
 */

const hashtagsRouter = Router();

/**
 * @swagger
 * /hashtags:
 *   get:
 *     summary: Search hashtags by prefix (typeahead)
 *     tags: [Hashtags]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Prefix to match against tag names
 *     responses:
 *       200:
 *         description: Matching hashtags returned
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
 *                     hashtags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tag:
 *                             type: string
 *                           posts_count:
 *                             type: integer
 */
hashtagsRouter.get(
  '/',
  validateDataMiddleware(hashtagsValidator.searchQueryValidator, 'query'),
  WatchAsyncController(hashtagsController.searchHashtags)
);

/**
 * @swagger
 * /hashtags/trending:
 *   get:
 *     summary: Get trending hashtags
 *     tags: [Hashtags]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Number of trending hashtags to return
 *     responses:
 *       200:
 *         description: Trending hashtags returned
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
 *                     hashtags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tag:
 *                             type: string
 *                           posts_count:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                             format: date-time
 */
hashtagsRouter.get(
  '/trending',
  validateDataMiddleware(hashtagsValidator.trendingQueryValidator, 'query'),
  WatchAsyncController(hashtagsController.getTrendingHashtags)
);

/**
 * @swagger
 * /hashtags/{tag}:
 *   get:
 *     summary: Get hashtag metadata
 *     tags: [Hashtags]
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag name without the # symbol
 *     responses:
 *       200:
 *         description: Hashtag metadata returned
 *       404:
 *         description: Hashtag not found
 */
hashtagsRouter.get(
  '/:tag',
  validateDataMiddleware(hashtagsValidator.hashtagParamValidator, 'params'),
  WatchAsyncController(hashtagsController.getHashtag)
);

/**
 * @swagger
 * /hashtags/{tag}/posts:
 *   get:
 *     summary: Get posts by hashtag
 *     tags: [Hashtags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag name without the # symbol
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
 *         description: Posts for the hashtag returned
 *       400:
 *         description: Hashtag not found
 */
hashtagsRouter.get(
  '/:tag/posts',
  optionalAuth,
  validateDataMiddleware(hashtagsValidator.hashtagParamValidator, 'params'),
  validateDataMiddleware(hashtagsValidator.hashtagFeedQueryValidator, 'query'),
  WatchAsyncController(hashtagsController.getPostsByHashtag)
);

export default hashtagsRouter;
