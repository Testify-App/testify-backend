import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { firebaseAuth } from '../../config/firebase';
import { FirebaseDecodedUser } from '../../types/firebase.types';

export interface FirebaseAuthenticatedRequest extends Request {
  firebaseUser?: FirebaseDecodedUser;
}

function mapFirebaseError(code: string): { status: number; message: string } {
  switch (code) {
    case 'auth/id-token-expired':
      return { status: StatusCodes.UNAUTHORIZED, message: 'Token has expired.' };
    case 'auth/id-token-revoked':
      return { status: StatusCodes.UNAUTHORIZED, message: 'Token has been revoked.' };
    case 'auth/invalid-id-token':
      return { status: StatusCodes.UNAUTHORIZED, message: 'Invalid token.' };
    case 'auth/user-disabled':
      return { status: StatusCodes.FORBIDDEN, message: 'User account is disabled.' };
    case 'auth/user-not-found':
      return { status: StatusCodes.NOT_FOUND, message: 'User not found.' };
    default:
      return { status: StatusCodes.UNAUTHORIZED, message: 'Authentication failed.' };
  }
}

export const verifyFirebaseToken = async (
  req: FirebaseAuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'error',
      code: StatusCodes.UNAUTHORIZED,
      message: 'Authorization token is missing.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await firebaseAuth.verifyIdToken(token, true);

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified ?? false,
      name: decoded.name,
      picture: decoded.picture,
      role: (decoded as any).role,
    };

    next();
  } catch (error: any) {
    const { status, message } = mapFirebaseError(error?.code ?? '');
    res.status(status).json({
      status: 'error',
      code: status,
      message,
    });
  }
};
