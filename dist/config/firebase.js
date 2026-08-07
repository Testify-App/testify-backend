"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseMessaging = exports.firebaseFirestore = exports.firebaseAuth = void 0;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const messaging_1 = require("firebase-admin/messaging");
function buildCredential() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    }
    if (!privateKey.startsWith('-----BEGIN')) {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf8');
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
    return { projectId, clientEmail, privateKey };
}
function initFirebase() {
    const existing = (0, app_1.getApps)();
    if (existing.length > 0) {
        return existing[0];
    }
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    return (0, app_1.initializeApp)(Object.assign({ credential: (0, app_1.cert)(buildCredential()) }, (storageBucket && { storageBucket })));
}
const firebaseApp = initFirebase();
exports.firebaseAuth = (0, auth_1.getAuth)(firebaseApp);
exports.firebaseFirestore = (0, firestore_1.getFirestore)(firebaseApp);
exports.firebaseMessaging = (0, messaging_1.getMessaging)(firebaseApp);
exports.default = firebaseApp;
//# sourceMappingURL=firebase.js.map