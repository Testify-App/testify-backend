import { Router } from 'express';
import * as authValidator from './validator';
import authenticationController from './controller';
import { WatchAsyncController } from '../../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../shared/middlewares/request-validator.middleware';
import { protectedRoute, sessionRoute } from '../shared/middlewares/protected-route.middleware';

/**
 * @swagger
 * tags:
 *   name: Backoffice Authentication
 *   description: Admin authentication and authorization endpoints
 */

const authenticationRouter = Router();

/**
 * @swagger
 * /backoffice/auth/login:
 *   post:
 *     summary: Admin login (step 1 - credentials)
 *     description: Validates admin email/password and, on success, sends a 6-digit OTP to the admin's registered email to complete sign-in.
 *     tags: [Backoffice Authentication]
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
 *                 example: admin@testify.app
 *               password:
 *                 type: string
 *                 format: password
 *                 example: TestifyAdmin1
 *     responses:
 *       200:
 *         description: Verification code sent to registered email
 *       400:
 *         description: Invalid credentials, locked or suspended account
 */
authenticationRouter.post(
  '/login',
  validateDataMiddleware(authValidator.loginPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.login)
);

/**
 * @swagger
 * /backoffice/auth/login/resend:
 *   post:
 *     summary: Resend login OTP
 *     description: Resends the login verification code. Subject to a 60-second cooldown between requests.
 *     tags: [Backoffice Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6a2f1e2a-1e2a-4a2a-8a2a-1e2a4a2a8a2a
 *     responses:
 *       200:
 *         description: New verification code sent
 *       400:
 *         description: Locked account or resend requested before cooldown elapsed
 *       404:
 *         description: Admin not found
 */
authenticationRouter.post(
  '/login/resend',
  validateDataMiddleware(authValidator.resendLoginOTPPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.resendLoginOTP)
);

/**
 * @swagger
 * /backoffice/auth/login/verify:
 *   post:
 *     summary: Admin login (step 2 - verify OTP)
 *     description: Verifies the 6-digit login OTP and, on success, completes login and issues a JWT session token.
 *     tags: [Backoffice Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - otp
 *             properties:
 *               id:
 *                 type: string
 *                 example: 6a2f1e2a-1e2a-4a2a-8a2a-1e2a4a2a8a2a
 *               otp:
 *                 type: string
 *                 example: "012345"
 *     responses:
 *       200:
 *         description: Login successful, JWT token issued
 *       400:
 *         description: Invalid or expired OTP, locked or suspended account
 */
authenticationRouter.post(
  '/login/verify',
  validateDataMiddleware(authValidator.verifyLoginOTPPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.verifyLoginOTP)
);

/**
 * @swagger
 * /backoffice/auth/forgot-password:
 *   post:
 *     summary: Request a password reset code
 *     description: Sends a 6-digit password reset OTP to the admin's registered email.
 *     tags: [Backoffice Authentication]
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
 *                 example: admin@testify.app
 *     responses:
 *       200:
 *         description: Reset code sent to registered email
 *       404:
 *         description: No account found with this information
 */
authenticationRouter.post(
  '/forgot-password',
  validateDataMiddleware(authValidator.forgotPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.forgotPassword)
);

/**
 * @swagger
 * /backoffice/auth/forgot-password/resend:
 *   post:
 *     summary: Resend password reset code
 *     description: Resends the password reset OTP. Subject to a 60-second cooldown between requests.
 *     tags: [Backoffice Authentication]
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
 *                 example: admin@testify.app
 *     responses:
 *       200:
 *         description: New reset code sent
 *       400:
 *         description: Resend requested before cooldown elapsed
 *       404:
 *         description: No account found with this information
 */
authenticationRouter.post(
  '/forgot-password/resend',
  validateDataMiddleware(authValidator.forgotPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.resendForgotPasswordOTP)
);

/**
 * @swagger
 * /backoffice/auth/forgot-password/verify:
 *   post:
 *     summary: Verify password reset OTP
 *     description: Verifies the 6-digit password reset OTP and returns a short-lived hash used to authorize the final password reset.
 *     tags: [Backoffice Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@testify.app
 *               otp:
 *                 type: string
 *                 example: "012345"
 *     responses:
 *       200:
 *         description: OTP verified, returns hash_id_key for the reset step
 *       400:
 *         description: Invalid or expired OTP
 */
authenticationRouter.post(
  '/forgot-password/verify',
  validateDataMiddleware(authValidator.verifyForgotPasswordOTPPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.verifyForgotPasswordOTP)
);

/**
 * @swagger
 * /backoffice/auth/forgot-password/reset:
 *   patch:
 *     summary: Reset password
 *     description: Sets a new password using the hash_id_key obtained from the verify-OTP step.
 *     tags: [Backoffice Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hash_id_key
 *               - new_password
 *               - confirm_new_password
 *             properties:
 *               hash_id_key:
 *                 type: string
 *                 example: 6a2f1e2a-1e2a-4a2a-8a2a-1e2a4a2a8a2a
 *               new_password:
 *                 type: string
 *                 format: password
 *                 example: NewPass8!
 *               confirm_new_password:
 *                 type: string
 *                 format: password
 *                 example: NewPass8!
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Passwords do not match, or hash_id_key invalid/expired
 */
authenticationRouter.patch(
  '/forgot-password/reset',
  validateDataMiddleware(authValidator.resetPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.resetPassword)
);

/**
 * @swagger
 * /backoffice/auth/me:
 *   get:
 *     summary: Signed-in admin's profile, role and effective permission keys
 *     description: Permissions are the role's permissions plus any active per-admin grants. Root accounts receive every permission key.
 *     tags: [Backoffice Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Missing, invalid, expired, idle or superseded session
 *       403:
 *         description: No active role assigned
 */
authenticationRouter.get(
  '/me',
  ...protectedRoute,
  WatchAsyncController(authenticationController.fetchProfile)
);

/**
 * @swagger
 * /backoffice/auth/me:
 *   patch:
 *     summary: Update the signed-in admin's own profile
 *     description: |
 *       Names are saved title-cased ("ADA o'brien-okafor" -> "Ada O'Brien-Okafor").
 *       phone_number is optional: an optional leading + and 7-15 digits (spaces, dashes, dots and
 *       brackets ignored), stored without separators. Omit it to keep the current number;
 *       send an empty string or null to clear it. Returns the same profile shape as GET /auth/me.
 *     tags: [Backoffice Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *             properties:
 *               first_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Ada
 *               last_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: O'Brien-Okafor
 *               phone_number:
 *                 type: string
 *                 nullable: true
 *                 example: "+234 803 123 4567"
 *     responses:
 *       200:
 *         description: Profile updated successfully (data is the GET /auth/me profile)
 *       400:
 *         description: Enter a valid 11-digit phone number.
 *       401:
 *         description: Missing, invalid, expired, idle or superseded session
 *       409:
 *         description: Phone number already in use.
 *       422:
 *         description: Missing or over-long first_name / last_name
 */
authenticationRouter.patch(
  '/me',
  ...protectedRoute,
  validateDataMiddleware(authValidator.updateProfilePayloadValidator, 'body'),
  WatchAsyncController(authenticationController.updateProfile)
);

/**
 * @swagger
 * /backoffice/auth/password:
 *   patch:
 *     summary: Change the signed-in admin's password
 *     description: |
 *       Requires the current password. The new password follows the same rule as reset/invite
 *       acceptance: at least 8 characters, one uppercase letter, one number, no spaces.
 *       The current portal session stays signed in. A wrong current password does not count
 *       towards login lockout.
 *     tags: [Backoffice Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *               - confirm_new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *               new_password:
 *                 type: string
 *                 format: password
 *                 example: NewPass8!
 *               confirm_new_password:
 *                 type: string
 *                 format: password
 *                 example: NewPass8!
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: |
 *           "Passwords do not match.", a password-rule message (e.g. "New password should contain at least 1 uppercase character"),
 *           "Current password is incorrect." or "New password must be different from your current password."
 *       401:
 *         description: Missing, invalid, expired, idle or superseded session
 *       422:
 *         description: A required field is missing
 */
authenticationRouter.patch(
  '/password',
  ...protectedRoute,
  validateDataMiddleware(authValidator.changePasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.changePassword)
);

/**
 * @swagger
 * /backoffice/auth/logout:
 *   post:
 *     summary: End the current session
 *     description: Clears the session so this token is rejected on every later request.
 *     tags: [Backoffice Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Session already ended
 */
authenticationRouter.post(
  '/logout',
  ...sessionRoute,
  WatchAsyncController(authenticationController.logout)
);

export default authenticationRouter;
