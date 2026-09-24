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
let cachedApp;
function initFirebase() {
    if (cachedApp)
        return cachedApp;
    const existing = (0, app_1.getApps)();
    if (existing.length > 0) {
        cachedApp = existing[0];
        return cachedApp;
    }
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    cachedApp = (0, app_1.initializeApp)(Object.assign({ credential: (0, app_1.cert)(buildCredential()) }, (storageBucket && { storageBucket })));
    return cachedApp;
}
function lazyService(resolve) {
    let instance;
    const load = () => (instance !== null && instance !== void 0 ? instance : (instance = resolve()));
    return new Proxy({}, {
        get(_target, property) {
            const service = load();
            const value = service[property];
            return typeof value === 'function' ? value.bind(service) : value;
        },
        has(_target, property) {
            return property in load();
        },
        getPrototypeOf() {
            return Reflect.getPrototypeOf(load());
        },
    });
}
exports.firebaseAuth = lazyService(() => (0, auth_1.getAuth)(initFirebase()));
exports.firebaseFirestore = lazyService(() => (0, firestore_1.getFirestore)(initFirebase()));
exports.firebaseMessaging = lazyService(() => (0, messaging_1.getMessaging)(initFirebase()));
exports.default = lazyService(() => initFirebase());
//# sourceMappingURL=firebase.js.map