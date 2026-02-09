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
 *         $ref: '#/components/responses/Error'
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

export default profilesRouter;
