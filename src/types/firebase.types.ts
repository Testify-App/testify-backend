import { DecodedIdToken } from 'firebase-admin/auth';
import { WhereFilterOp } from 'firebase-admin/firestore';

export interface FirebaseDecodedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  role?: string;
  [key: string]: unknown;
}

export interface FirebaseAuthenticatedRequest extends Express.Request {
  firebaseUser?: FirebaseDecodedUser;
}

export interface FcmMessage {
  token?: string;
  tokens?: string[];
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  responses?: Array<{ success: boolean; messageId?: string; error?: string }>;
}

export type FirestoreWhereOp = WhereFilterOp;

export type { DecodedIdToken };
