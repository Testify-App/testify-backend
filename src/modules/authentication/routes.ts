import { Router } from 'express';
import * as authValidator from './validator';
import authenticationController from './controller';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

const authenticationRouter = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Successfully logged in.
 *       400:
 *         description: Invalid credentials
 */
authenticationRouter.post(
  '/login',
  validateDataMiddleware(authValidator.loginPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.login)
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *               - dob
 *               - terms_and_condition
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               username:
 *                 type: string
 *                 example: johndoe
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1995-01-15
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: https://cdn.example.com/avatar.jpg
 *               terms_and_condition:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Registration successful, verification code sent
 *       400:
 *         description: Validation error
 */
authenticationRouter.post(
  '/register',
  validateDataMiddleware(authValidator.registerPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.register)
);

/**
 * @swagger
 * /auth/register/activate:
 *   patch:
 *     summary: Activate registration with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - token
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               token:
 *                 type: string
 *                 pattern: ^[0-9]{4}$
 *                 example: 1234
 *     responses:
 *       200:
 *         description: Account activated successfully
 *       400:
 *         description: Invalid or expired OTP
 */
authenticationRouter.patch(
  '/register/activate',
  validateDataMiddleware(authValidator.activateRegistrationPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.activateRegistration)
);

/**
 * @swagger
 * /auth/username-availability:
 *   get:
 *     summary: Check username availability
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: johndoe
 *     responses:
 *       200:
 *         description: Username is available
 *       400:
 *         description: Username already taken
 */
authenticationRouter.get(
  '/username-availability',
  validateDataMiddleware(authValidator.usernameAvailabilityQueryValidator, 'query'),
  WatchAsyncController(authenticationController.usernameAvailability)
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       404:
 *         description: Email not found
 */
authenticationRouter.post(
  '/forgot-password',
  validateDataMiddleware(authValidator.forgotPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.forgotPassword),
);

/**
 * @swagger
 * /auth/forgot-password/verify:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - token
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               token:
 *                 type: string
 *                 pattern: ^[0-9]{4}$
 *     responses:
 *       200:
 *         description: OTP verified, hash-id-key returned
 *       400:
 *         description: Invalid or expired OTP
 */
authenticationRouter.post(
  '/forgot-password/verify',
  validateDataMiddleware(authValidator.verifyForgotPasswordOTPPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.verifyForgotPasswordOTP),
);

/**
 * @swagger
 * /auth/forgot-password/reset:
 *   patch:
 *     summary: Reset password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - new_password
 *               - confirm_new_password
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               new_password:
 *                 type: string
 *                 format: password
 *               confirm_new_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Passwords do not match
 */
authenticationRouter.patch(
  '/forgot-password/reset',
  validateDataMiddleware(authValidator.resetPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.resetPassword),
);

export default authenticationRouter;
