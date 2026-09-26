import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { User } from '../../shared/interface';
import { fnRequest } from '../../shared/types';
import logger from '../../shared/services/logger';
import * as ResponseBuilder from '../../shared/lib/api-response';
import UploadsService from './services';
import { UploadPurpose } from './validator';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class UploadsController {
  /**
   * Limits, so the client can reject a too-large file before asking for a URL.
   * Unauthenticated: it exposes nothing but our own configuration, and the
   * mobile app needs it before a user is necessarily signed in.
   */
  public limits: fnRequest = async (_req: AuthenticatedRequest, res) =>
    ResponseBuilder.success(
      res,
      'Upload limits.',
      StatusCodes.OK,
      UploadsService.uploadLimits(),
    );

  /**
   * Hand the client a short-lived URL to upload one file directly to S3.
   * The bytes never reach this server.
   */
  public presign: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;

    try {
      const result = await UploadsService.presignUpload(
        userId,
        req.body.purpose as UploadPurpose,
        req.body.contentType as string,
        req.body.contentLength as number,
      );

      return ResponseBuilder.success(
        res,
        'Upload URL generated.',
        StatusCodes.OK,
        result,
      );
    } catch (err: any) {
      logger.error(err.message, 'uploads.controller.ts');
      return ResponseBuilder.error(res, err, StatusCodes.BAD_REQUEST);
    }
  };

  /**
   * Promote a staged upload to its permanent location and return the CDN URL
   * the client should store and display.
   */
  public confirm: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;

    try {
      const result = await UploadsService.confirmUpload(
        userId,
        req.body.key as string,
      );

      return ResponseBuilder.success(
        res,
        'Upload confirmed.',
        StatusCodes.OK,
        result,
      );
    } catch (err: any) {
      logger.error(err.message, 'uploads.controller.ts');

      /**
       * A missing object is the common, expected failure: the client confirmed
       * without completing the PUT, or waited past the 24-hour lifecycle
       * deletion. That is a 404, not a server error.
       */
      const notFound =
        err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404;

      return ResponseBuilder.error(
        res,
        notFound ? new Error('upload not found or expired') : err,
        notFound ? StatusCodes.NOT_FOUND : StatusCodes.BAD_REQUEST,
      );
    }
  };
}

export default new UploadsController();
