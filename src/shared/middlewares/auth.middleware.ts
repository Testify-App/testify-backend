import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SignedData, User } from '../interface';
import jwtSigningService from '../services/jwt';

export interface ExtendedRequest extends Request {
  user: User;
}

export const verifyAuthTokenMiddleware = (
  req: ExtendedRequest, res: Response, next: NextFunction,
) => {
  const token = (req?.headers?.authorization as string)?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: 'error',
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'token not found.',
    });
  }
  try {
    const decoded = jwtSigningService.verify(token) as SignedData;
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'invalid token.',
    });
  }
};
