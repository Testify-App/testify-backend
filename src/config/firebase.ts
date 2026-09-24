import {
  initializeApp,
  getApps,
  cert,
  App,
  ServiceAccount,
} from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

/**
 * Firebase is initialised on first use, not at import.
 *
 * Previously `initFirebase()` ran at module load, and `buildCredential()`
 * throws when the credentials are absent. Because this module is reached from
 * the route tree, that meant **the entire API refused to start** without
 * Firebase credentials — including endpoints that have nothing to do with push
 * notifications, and including `/healthcheck/ping`.
 *
 * On AWS the credentials come from Parameter Store
 * (`/testifyhub/prod/app/FIREBASE_*`). Until the real Firebase project exists
 * they are placeholders, so an eager failure here blocks deploying or testing
 * anything at all.
 *
 * Deferring the failure is the right trade: push notifications fail loudly at
 * the point they are used, with the same clear error, instead of taking the
 * whole service down at boot. The error message is unchanged.
 */

function buildCredential(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  if (!privateKey.startsWith('-----BEGIN')) {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  return { projectId, clientEmail, privateKey };
}

let cachedApp: App | undefined;

function initFirebase(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  cachedApp = initializeApp({
    credential: cert(buildCredential()),
    ...(storageBucket && { storageBucket }),
  });

  return cachedApp;
}

/**
 * Returns a stand-in that resolves the real service on first property access,
 * so existing call sites (`firebaseMessaging.send(...)`) are unchanged.
 */
function lazyService<T extends object>(resolve: () => T): T {
  let instance: T | undefined;
  const load = (): T => (instance ??= resolve());

  return new Proxy({} as T, {
    get(_target, property) {
      const service = load() as Record<string | symbol, unknown>;
      const value = service[property];
      return typeof value === 'function' ? value.bind(service) : value;
    },
    has(_target, property) {
      return property in (load() as object);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(load());
    },
  });
}

export const firebaseAuth = lazyService<Auth>(() => getAuth(initFirebase()));
export const firebaseFirestore = lazyService<Firestore>(() =>
  getFirestore(initFirebase()),
);
export const firebaseMessaging = lazyService<Messaging>(() =>
  getMessaging(initFirebase()),
);

export default lazyService<App>(() => initFirebase());
