import { Router, RequestHandler } from 'express';
import * as profilesValidator from './validator';
import profilesController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;


/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: Profile management endpoints
 */

const profilesRouter = Router();

/**
 * @swagger
 * /profiles:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 */
profilesRouter.get(
  '/',
  verifyAuth,
  WatchAsyncController(profilesController.getProfile)
);

/**
 * @swagger
 * /profiles:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 maxLength: 100
 *                 example: John
 *               last_name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Doe
 *               country_code:
 *                 type: string
 *                 maxLength: 10
 *                 example: +1
 *               phone_number:
 *                 type: string
 *                 maxLength: 20
 *                 example: 1234567890
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/avatar.jpg
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: johndoe
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: This is my bio
 *               display_name:
 *                 type: string
 *                 example: benny
 *               header_image:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/header_image.jpg
 *               instagram:
 *                 type: string
 *                 format: uri
 *                 example: https://instagram.com/johndoe
 *               youtube:
 *                 type: string
 *                 format: uri
 *                 example: https://youtube.com/@johndoe
 *               twitter:
 *                 type: string
 *                 format: uri
 *                 example: https://twitter.com/johndoe
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Bad request
 *     securitySchemes:
 *       bearerAuth:
 *         type: http
 *         scheme: bearer
 *         bearerFormat: JWT
 */
profilesRouter.put(
  '/',
  verifyAuth,
  validateDataMiddleware(profilesValidator.updateProfileValidator, 'body'),
  WatchAsyncController(profilesController.updateProfile)
);

/**
 * @swagger
 * /profiles/tribe:
 *   post:
 *     summary: Add user to Tribe (follow)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               following_id:
 *                 type: string
 *                 description: ID of user to follow
 *     responses:
 *       201:
 *         description: User added to Tribe successfully
 *       400:
 *         description: Cannot follow yourself or already following
 */
profilesRouter.post(
  '/tribe',
  verifyAuth,
  validateDataMiddleware(profilesValidator.addToTribeValidator, 'body'),
  WatchAsyncController(profilesController.addToTribe)
);

/**
 * @swagger
 * /profiles/tribe/{following_id}:
 *   delete:
 *     summary: Remove user from Tribe (unfollow)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: following_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from Tribe successfully
 */
profilesRouter.delete(
  '/tribe/:following_id',
  verifyAuth,
  WatchAsyncController(profilesController.removeFromTribe)
);

/**
 * @swagger
 * /profiles/tribe:
 *   get:
 *     summary: Get Tribe members list
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter Tribe members by username or display name
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
 *         description: Tribe members retrieved successfully
 */
profilesRouter.get(
  '/tribe',
  verifyAuth,
  validateDataMiddleware(profilesValidator.getTribeMembersValidator, 'query'),
  WatchAsyncController(profilesController.getTribeMembers)
);

/**
 * @swagger
 * /profiles/search:
 *   get:
 *     summary: Search profiles by username
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         required: true
 *         description: Username to search for
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: john
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
 *         description: Profiles found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profiles found
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *       500:
 *         description: Internal server error
 */
profilesRouter.get(
  '/search',
  verifyAuth,
  validateDataMiddleware(profilesValidator.searchProfilesByUsernameValidator, 'query'),
  WatchAsyncController(profilesController.searchProfilesByUsername)
);

/**
 * @swagger
 * /profiles/{following_id}/posts:
 *   get:
 *     summary: Get profile post history by user ID
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: following_id
 *         in: path
 *         required: true
 *         description: ID of the user whose profile posts to retrieve
 *         schema:
 *           type: string
 *           format: uuid
 *           example: 550e8400-e29b-41d4-a716-446655440000
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
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile found
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1
 *                     currentPage:
 *                       type: string
 *                       example: "1"
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                     first_name:
 *                       type: string
 *                       example: John
 *                     last_name:
 *                       type: string
 *                       example: Doe
 *                     country_code:
 *                       type: string
 *                       example: "+1"
 *                     phone_number:
 *                       type: string
 *                       example: "1234567890"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: john@example.com
 *                     avatar:
 *                       type: string
 *                       format: uri
 *                       example: https://cdn.example.com/avatars/john.jpg
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     bio:
 *                       type: string
 *                       example: This is my bio
 *                     tribe_members_count:
 *                       type: integer
 *                       example: 10
 *                     prayer_count:
 *                       type: integer
 *                       example: 2
 *                     posts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           content:
 *                             type: string
 *                           username:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                             nullable: true
 *                           bio:
 *                             type: string
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       404:
 *         description: Profile not found
 */
profilesRouter.get(
  '/:following_id/posts',
  verifyAuth,
  validateDataMiddleware(profilesValidator.fetchProfilePostHistoryByIdValidator, 'query'),
  WatchAsyncController(profilesController.fetchProfilePostHistoryById)
);

/**
 * @swagger
 * /profiles/tribe/is-member/{userId}:
 *   get:
 *     summary: Check if user is in Tribe
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tribe membership checked
 */
profilesRouter.get(
  '/tribe/is-member/:userId',
  verifyAuth,
  WatchAsyncController(profilesController.isInTribe)
);

/**
 * @swagger
 * /profiles/followers:
 *   get:
 *     summary: Get followers of the authenticated user
 *     description: Each follower includes profile details and whether the authenticated user is following them back.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter followers by username or display name
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
 *         description: Followers retrieved successfully
 */
profilesRouter.get(
  '/followers',
  verifyAuth,
  validateDataMiddleware(profilesValidator.getFollowersValidator, 'query'),
  WatchAsyncController(profilesController.getMyFollowers)
);

/**
 * @swagger
 * /profiles/{userId}/followers:
 *   get:
 *     summary: Get followers of a specific user
 *     description: Each follower includes profile details and whether the authenticated user is following them.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter followers by username or display name
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
 *         description: Followers retrieved successfully
 */
profilesRouter.get(
  '/:userId/followers',
  verifyAuth,
  validateDataMiddleware(profilesValidator.getFollowersValidator, 'query'),
  WatchAsyncController(profilesController.getFollowersByUserId)
);

// Circle routes

/**
 * @swagger
 * /profiles/circle:
 *   post:
 *     summary: Add a user to your Circle
 *     description: Adds the user to your Circle immediately and mutually (no accept/decline step). Fails if either Circle already has 12 members.
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               connected_user_id:
 *                 type: string
 *                 description: ID of user to add to your Circle
 *     responses:
 *       201:
 *         description: User added to Circle
 *       400:
 *         description: Cannot add yourself, already in Circle, or a Circle is full (max 12 members)
 */
profilesRouter.post(
  '/circle',
  verifyAuth,
  validateDataMiddleware(profilesValidator.addToCircleValidator, 'body'),
  WatchAsyncController(profilesController.addToCircle)
);

/**
 * @swagger
 * /profiles/circle/{userId}:
 *   delete:
 *     summary: Remove user from Circle
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User removed from Circle successfully
 */
profilesRouter.delete(
  '/circle/:userId',
  verifyAuth,
  WatchAsyncController(profilesController.removeFromCircle)
);

/**
 * @swagger
 * /profiles/circle:
 *   get:
 *     summary: Get Circle members list
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: search
 *         in: query
 *         description: Search by username or name
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: john
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         schema:
 *           type: number
 *           integer: true
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of items per page
 *         schema:
 *           type: number
 *           integer: true
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Circle members retrieved successfully
 */
profilesRouter.get(
  '/circle',
  verifyAuth,
  validateDataMiddleware(profilesValidator.getCircleMembersValidator, 'query'),
  WatchAsyncController(profilesController.getCircleMembers)
);

/**
 * @swagger
 * /profiles/circle/count:
 *   get:
 *     summary: Get Circle members count
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Circle count retrieved successfully
 */
profilesRouter.get(
  '/circle/count',
  verifyAuth,
  WatchAsyncController(profilesController.getCircleCount)
);

/**
 * @swagger
 * /profiles/circle/is-member/{userId}:
 *   get:
 *     summary: Check if user is in Circle
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Circle membership checked
 */
profilesRouter.get(
  '/circle/is-member/:userId',
  verifyAuth,
  WatchAsyncController(profilesController.isInCircle)
);

export default profilesRouter;
