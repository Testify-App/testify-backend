"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = void 0;
const http_status_codes_1 = require("http-status-codes");
const firebase_1 = require("../../config/firebase");
function mapFirebaseError(code) {
    switch (code) {
        case 'auth/id-token-expired':
            return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, message: 'Token has expired.' };
        case 'auth/id-token-revoked':
            return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, message: 'Token has been revoked.' };
        case 'auth/invalid-id-token':
            return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, message: 'Invalid token.' };
        case 'auth/user-disabled':
            return { status: http_status_codes_1.StatusCodes.FORBIDDEN, message: 'User account is disabled.' };
        case 'auth/user-not-found':
            return { status: http_status_codes_1.StatusCodes.NOT_FOUND, message: 'User not found.' };
        default:
            return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, message: 'Authentication failed.' };
    }
}
const verifyFirebaseToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            status: 'error',
            code: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: 'Authorization token is missing.',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = yield firebase_1.firebaseAuth.verifyIdToken(token, true);
        req.firebaseUser = {
            uid: decoded.uid,
            email: decoded.email,
            emailVerified: (_a = decoded.email_verified) !== null && _a !== void 0 ? _a : false,
            name: decoded.name,
            picture: decoded.picture,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        const { status, message } = mapFirebaseError((_b = error === null || error === void 0 ? void 0 : error.code) !== null && _b !== void 0 ? _b : '');
        res.status(status).json({
            status: 'error',
            code: status,
            message,
        });
    }
});
exports.verifyFirebaseToken = verifyFirebaseToken;
//# sourceMappingURL=firebaseAuth.middleware.js.map