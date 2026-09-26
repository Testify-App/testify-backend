import { Router, RequestHandler } from 'express';
import * as uploadsValidator from './validator';
import uploadsController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Presigned S3 upload endpoints. The client uploads file bytes directly to S3 using the returned url/fields — file bytes never pass through this API.
 */

const uploadsRouter = Router();

/**
 * @swagger
 * /uploads/presign:
 *   post:
 *     summary: Get a presigned S3 POST for direct-to-S3 upload
 *     description: |
 *       Returns a presigned S3 POST policy. The client must POST the file as multipart/form-data
 *       directly to `url`, including all returned `fields` plus a `file` field with the file bytes,
 *       in that order. On success, submit `public_url` into the relevant post/profile/community/story field.
 *
 *       Contexts and limits:
 *       - avatar: image/jpeg, image/png, image/webp — max 5MB
 *       - community_avatar: image/jpeg, image/png, image/webp — max 5MB
 *       - community_cover: image/jpeg, image/png, image/webp — max 8MB
 *       - post_image: image/jpeg, image/png, image/webp, image/heic — max 10MB
 *       - post_video: video/mp4, video/quicktime, video/webm — max 200MB
 *       - post_audio: audio/mpeg, audio/mp4, audio/wav, audio/webm — max 20MB
 *       - comment_image: image/jpeg, image/png, image/webp — max 5MB
 *       - story_image: image/jpeg, image/png, image/webp — max 10MB
 *       - story_video: video/mp4, video/quicktime, video/webm — max 60MB
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context
 *               - content_type
 *             properties:
 *               context:
 *                 type: string
 *                 enum: [avatar, community_avatar, community_cover, post_image, post_video, post_audio, comment_image, story_image, story_video]
 *               content_type:
 *                 type: string
 *                 example: image/jpeg
 *     responses:
 *       201:
 *         description: Presigned upload created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: The S3 endpoint to POST the file to
 *                     fields:
 *                       type: object
 *                       description: Fields that must be included in the multipart POST body, in order, before the file field
 *                     key:
 *                       type: string
 *                       description: The S3 object key
 *                     public_url:
 *                       type: string
 *                       description: The URL to store once the upload completes
 *                     expires_in:
 *                       type: number
 *                       description: Seconds until this presigned POST expires
 *       400:
 *         description: Invalid context or unsupported content type for the given context
 */
uploadsRouter.post(
  '/presign',
  verifyAuth,
  validateDataMiddleware(uploadsValidator.createPresignedUploadValidator, 'body'),
  WatchAsyncController(uploadsController.createPresignedUpload)
);

export default uploadsRouter;
