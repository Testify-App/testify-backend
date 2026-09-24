"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OriginVerifyMiddleware = void 0;
const crypto_1 = require("crypto");
const http_status_codes_1 = require("http-status-codes");
const ApiResponse = __importStar(require("../lib/api-response"));
const HEADER = 'x-origin-verify';
const DEFAULT_EXEMPT_PATHS = ['/api/v1/healthcheck/ping'];
const exemptPaths = () => {
    const configured = process.env.ORIGIN_VERIFY_EXEMPT_PATHS;
    if (!configured)
        return DEFAULT_EXEMPT_PATHS;
    return configured
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
};
const matches = (provided, expected) => {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(a, b);
};
const OriginVerifyMiddleware = (req, res, next) => {
    const expected = process.env.ORIGIN_VERIFY_SECRET;
    if (!expected)
        return next();
    if (exemptPaths().includes(req.path))
        return next();
    const provided = req.headers[HEADER];
    if (typeof provided === 'string' && matches(provided, expected)) {
        return next();
    }
    ApiResponse.error(res, new Error('Forbidden'), http_status_codes_1.StatusCodes.FORBIDDEN);
};
exports.OriginVerifyMiddleware = OriginVerifyMiddleware;
exports.default = exports.OriginVerifyMiddleware;
//# sourceMappingURL=origin-verify.middleware.js.map