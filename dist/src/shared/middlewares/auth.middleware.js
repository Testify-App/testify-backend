"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuthTokenMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = __importDefault(require("../services/jwt"));
const verifyAuthTokenMiddleware = (req, res, next) => {
    var _a, _b;
    const token = (_b = (_a = req === null || req === void 0 ? void 0 : req.headers) === null || _a === void 0 ? void 0 : _a.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            status: 'error',
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            message: 'token not found.',
        });
    }
    try {
        const decoded = jwt_1.default.verify(token);
        req.user = decoded;
        return next();
    }
    catch (error) {
        return res.status(401).json({
            status: 'error',
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            message: 'invalid token.',
        });
    }
};
exports.verifyAuthTokenMiddleware = verifyAuthTokenMiddleware;
//# sourceMappingURL=auth.middleware.js.map