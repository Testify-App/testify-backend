import { Router, RequestHandler } from 'express';
import * as uploadsValidator from './validator';
import uploadsController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler =
  AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Direct-to-S3 media upload
 */

const uploadsRouter = Router();

/**
 * @swagger
 * /uploads/presign:
 *   post:
 *     summary: Request a short-lived URL to upload one image directly to S3
 *     description: >
 *       Step 1 of 3. Image bytes never pass through the API. The returned
 *       uploadUrl is valid for 5 minutes and is signed for exactly the
 *       contentType and contentLength given here — the client must PUT with
 *       that exact Content-Type and body size or S3 rejects the request.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purpose, contentType, contentLength]
 *             properties:
 *               purpose:
 *                 type: string
 *                 enum: [post, profile]
 *               contentType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/webp]
 *               contentLength:
 *                 type: integer
 *                 description: Exact byte size of the file. Max 10485760 (10 MB).
 *     responses:
 *       200:
 *         description: Upload URL generated
 *       400:
 *         description: Unsupported type, or size outside the allowed range
 *       401:
 *         description: Unauthenticated
 */
uploadsRouter.post(
  '/presign',
  verifyAuth,
  validateDataMiddleware(uploadsValidator.presignUploadValidator, 'body'),
  WatchAsyncController(uploadsController.presign),
);

/**
 * @swagger
 * /uploads/confirm:
 *   post:
 *     summary: Confirm a completed upload and receive its permanent CDN URL
 *     description: >
 *       Step 3 of 3, after the client has PUT the file to the signed URL.
 *       Moves the object out of the temporary area into its permanent prefix
 *       and returns the URL to store and display. Unconfirmed uploads are
 *       deleted automatically after 24 hours.
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key]
 *             properties:
 *               key:
 *                 type: string
 *                 description: The key returned by /uploads/presign.
 *     responses:
 *       200:
 *         description: Upload confirmed; returns the CDN url
 *       404:
 *         description: Upload not found or expired (never completed, or over 24h old)
 *       401:
 *         description: Unauthenticated
 */
uploadsRouter.post(
  '/confirm',
  verifyAuth,
  validateDataMiddleware(uploadsValidator.confirmUploadValidator, 'body'),
  WatchAsyncController(uploadsController.confirm),
);

export default uploadsRouter;
