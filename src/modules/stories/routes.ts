import { Router, RequestHandler } from 'express';
import * as storiesValidator from './validator';
import storiesController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Stories
 *   description: Ephemeral (24h) story endpoints
 */

const storiesRouter = Router();

/**
 * @swagger
 * /stories:
 *   post:
 *     summary: Post a new story (text, image, or video)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content_type
 *             properties:
 *               content_type:
 *                 type: string
 *                 enum: [text, image, video]
 *               media_url:
 *                 type: string
 *                 format: uri
 *               thumbnail_url:
 *                 type: string
 *                 format: uri
 *               text_content:
 *                 type: string
 *               background_style:
 *                 type: object
 *               duration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Story posted successfully
 *       400:
 *         description: Validation error
 */
storiesRouter.post(
  '/',
  verifyAuth,
  validateDataMiddleware(storiesValidator.createStoryValidator, 'body'),
  WatchAsyncController(storiesController.createStory)
);

/**
 * @swagger
 * /stories:
 *   get:
 *     summary: Get active stories from Circle members, grouped by user
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Circle stories retrieved successfully
 */
storiesRouter.get(
  '/',
  verifyAuth,
  WatchAsyncController(storiesController.getCircleStories)
);

/**
 * @swagger
 * /stories/me:
 *   get:
 *     summary: Get the authenticated user's own active stories
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stories retrieved successfully
 */
storiesRouter.get(
  '/me',
  verifyAuth,
  WatchAsyncController(storiesController.getMyStories)
);

/**
 * @swagger
 * /stories/{storyId}:
 *   get:
 *     summary: Get a single story (marks it viewed for the requester)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story retrieved successfully
 *       403:
 *         description: Not in this user's Circle
 *       404:
 *         description: Story not found
 */
storiesRouter.get(
  '/:storyId',
  verifyAuth,
  validateDataMiddleware(storiesValidator.storyIdValidator, 'params'),
  WatchAsyncController(storiesController.getStory)
);

/**
 * @swagger
 * /stories/{storyId}:
 *   delete:
 *     summary: Delete the authenticated user's own story early
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story deleted successfully
 *       404:
 *         description: Story not found or you are not the owner
 */
storiesRouter.delete(
  '/:storyId',
  verifyAuth,
  validateDataMiddleware(storiesValidator.storyIdValidator, 'params'),
  WatchAsyncController(storiesController.deleteStory)
);

/**
 * @swagger
 * /stories/{storyId}/views:
 *   get:
 *     summary: Get the list of users who viewed a story (owner only)
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Story viewers retrieved successfully
 *       400:
 *         description: Only the story owner can view the viewer list
 *       404:
 *         description: Story not found
 */
storiesRouter.get(
  '/:storyId/views',
  verifyAuth,
  validateDataMiddleware(storiesValidator.storyIdValidator, 'params'),
  validateDataMiddleware(storiesValidator.getStoryViewersValidator, 'query'),
  WatchAsyncController(storiesController.getStoryViewers)
);

export default storiesRouter;
