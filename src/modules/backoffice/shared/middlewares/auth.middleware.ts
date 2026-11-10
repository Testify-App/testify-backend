import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { TokenExpiredError } from 'jsonwebtoken';
import { SignedData } from '../../../../shared/interface';
import jwtSigningService from '../../../../shared/services/jwt';

export const verifyAuthTokenMiddleware = (
  req: Request, res: Response, next: NextFunction,
) => {
  const token = (req?.headers?.authorization as string)?.split(' ')[1];
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'token not found.',
    });
  }
  try {
    const decoded = jwtSigningService.verify(token) as SignedData;
    // Backoffice tokens carry a session_id; app-user tokens never do, so they can't be replayed here.
    if (!decoded?.session_id || decoded.scope !== 'backoffice') {
      throw new Error('invalid token.');
    }
    (req as any).user = decoded;
    return next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      statusCode: StatusCodes.UNAUTHORIZED,
      message: error instanceof TokenExpiredError
        ? 'Your session has expired. Please sign in again.'
        : 'invalid token.',
    });
  }
};
