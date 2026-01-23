import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';

export const validateDataMiddleware =
  (validationSchema: Joi.ObjectSchema, type: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const getType = {
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
      file: req.file,
    };

    const options = { messages: { key: '{{key}} ' }, abortEarly: false };
    const data = (getType as Record<string, any>)[type];

    try {
      // Use async validation to support Joi.external()
      const validatedData = await validationSchema.validateAsync(data, options);

      // Replace request data with sanitized values
      (req as any)[type] = validatedData;

      return next();
    } catch (error: any) {
      if (error.isJoi) {
        // Joi validation error
        const message = error.details?.[0]?.message?.replace(/"/g, '') || 'Validation failed';

        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          status: 'error',
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
          message,
        });
      }

      // Non-Joi error (e.g. DB fetch failed inside .external())
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: error.message || 'Internal server error',
      });
    }
  };
