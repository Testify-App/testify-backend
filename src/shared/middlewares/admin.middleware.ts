import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/database';
import { StatusCodes } from 'http-status-codes';
import { User } from '../interface';

export const verifyAdminMiddleware = async (
  req: Request & { user?: User }, res: Response, next: NextFunction,
) => {
  try {
    const user = await db.oneOrNone(
      'SELECT is_admin FROM users WHERE id = $1 AND deleted_at IS NULL',
      [req.user?.id]
    );
    if (!user?.is_admin) {
      return res.status(StatusCodes.FORBIDDEN).json({
        status: 'error',
        statusCode: StatusCodes.FORBIDDEN,
        message: 'Admin access required.',
      });
    }
    return next();
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Failed to verify admin access.',
    });
  }
};
