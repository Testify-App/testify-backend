import * as admin from 'firebase-admin';
import Env from '../shared/utils/env';

admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: Env.get<string>('KOINS_FIREBASE_PRIVATE_KEY').replace(
      /\\n/gm,
      '\n',
    ),
    projectId: Env.get<string>('KOINS_FIREBASE_PROJECT_ID'),
    clientEmail: Env.get<string>('KOINS_FIREBASE_CLIENT_EMAIL'),
  }),
});

// setup fcm messaging
export const firebaseMessaging = admin.messaging();