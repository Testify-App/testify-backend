"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalErrorCatcherMiddleware = GlobalErrorCatcherMiddleware;
const logger_1 = __importDefault(require("../../config/logger"));
const errors_1 = require("../lib/errors");
function GlobalErrorCatcherMiddleware(err, _req, res, _next) {
    logger_1.default.error(err);
    const isHttpException = err instanceof errors_1.HttpException;
    if ((err === null || err === void 0 ? void 0 : err.code) == null || !isHttpException) {
        res.status(500).send('Internal Server Error');
        return;
    }
    res.status(err.code).send(err.message);
}
//# sourceMappingURL=global-error-catcher.middleware.js.map