import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { SignedData, User } from '../interface';
import jwtSigningService from '../services/jwt';
import { getAccountStanding, standingErrorBody } from '../services/account-standing';

/** Exact text the mobile app matches to sign the user out (see dio_client.dart). */
export const SESSION_EXPIRED = 'Session expired';

export interface ExtendedRequest extends Request {
  user: User;
}

export const optionalAuthMiddleware = (
  req: Request & { user?: User }, _res: Response, next: NextFunction,
) => {
  const token = (req?.headers?.authorization as string)?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwtSigningService.verify(token) as SignedData;
      req.user = decoded;
    } catch {
      // invalid token — continue as guest
    }
  }
  return next();
};

export const verifyAuthTokenMiddleware = async (
  req: Request, res: Response, next: NextFunction,
) => {
  const token = (req?.headers?.authorization as string)?.split(' ')[1];
  if (!token) {
    // The mobile app signs the user out on a 401 whose message is "Session expired".
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      statusCode: StatusCodes.UNAUTHORIZED,
      message: SESSION_EXPIRED,
    });
  }
  let decoded: SignedData;
  try {
    decoded = jwtSigningService.verify(token) as SignedData;
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      statusCode: StatusCodes.UNAUTHORIZED,
      message: SESSION_EXPIRED,
    });
  }
  try {
    // Suspensions and bans apply on the next request: app tokens never expire.
    const standing = await getAccountStanding(decoded.id);
    if (standing.status !== 'active') {
      return res.status(StatusCodes.FORBIDDEN).json(standingErrorBody(standing));
    }
  } catch (error) {
    return next(error);
  }
  (req as ExtendedRequest).user = decoded;
  return next();
};
