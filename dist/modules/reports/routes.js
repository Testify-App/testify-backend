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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportsValidator = __importStar(require("./validator"));
const controller_1 = __importDefault(require("./controller"));
const AuthenticationMiddleware = __importStar(require("../../shared/middlewares/auth.middleware"));
const admin_middleware_1 = require("../../shared/middlewares/admin.middleware");
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const request_validator_middleware_1 = require("../../shared/middlewares/request-validator.middleware");
const verifyAuth = AuthenticationMiddleware.verifyAuthTokenMiddleware;
const verifyAdmin = admin_middleware_1.verifyAdminMiddleware;
const reportsRouter = (0, express_1.Router)();
reportsRouter.post('/', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(reportsValidator.createReportValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.createReport));
reportsRouter.get('/', verifyAuth, verifyAdmin, (0, request_validator_middleware_1.validateDataMiddleware)(reportsValidator.getReportsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getReports));
reportsRouter.patch('/:reportId', verifyAuth, verifyAdmin, (0, request_validator_middleware_1.validateDataMiddleware)(reportsValidator.reportIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(reportsValidator.reviewReportValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.reviewReport));
exports.default = reportsRouter;
//# sourceMappingURL=routes.js.map