import { Router } from 'express';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import postsController from '../posts/controller';
import profilesController from '../profiles/controller';

/**
 * @swagger
 * tags:
 *   name: Guest
 *   description: Public endpoints accessible without authentication
 */

const guestRouter = Router();

/**
 * @swagger
 * /guest/posts:
 *   get:
 *     summary: Get public posts feed (no auth required)
 *     tags: [Guest]
 *     parameters:
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
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Posts retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
guestRouter.get('/posts', WatchAsyncController(postsController.getGuestPosts));

/**
 * @swagger
 * /guest/profiles/{username}:
 *   get:
 *     summary: Get a user's public profile by username (no auth required)
 *     tags: [Guest]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: The username of the profile to retrieve
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 */
guestRouter.get('/profiles/:username', WatchAsyncController(profilesController.getGuestProfile));

export default guestRouter;
