import * as admin from 'firebase-admin';

function buildCredential(): admin.ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  // Support base64-encoded key (common in CI/CD / container envs)
  if (!privateKey.startsWith('-----BEGIN')) {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
  }

  // Restore escaped newlines written as literal \n in env files
  privateKey = privateKey.replace(/\\n/g, '\n');

  return { projectId, clientEmail, privateKey };
}

function initFirebase(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  return admin.initializeApp({
    credential: admin.credential.cert(buildCredential()),
    ...(storageBucket && { storageBucket }),
  });
}

const firebaseApp = initFirebase();

export const firebaseAuth = admin.auth(firebaseApp);
export const firebaseFirestore = admin.firestore(firebaseApp);
export const firebaseMessaging = admin.messaging(firebaseApp);

export default firebaseApp;
