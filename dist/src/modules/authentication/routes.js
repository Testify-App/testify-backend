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
const authValidator = __importStar(require("./validator"));
const controller_1 = __importDefault(require("./controller"));
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const request_validator_middleware_1 = require("../../shared/middlewares/request-validator.middleware");
const authenticationRouter = (0, express_1.Router)();
authenticationRouter.post('/login', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.loginPayloadValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.login));
authenticationRouter.post('/register', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.registerPayloadValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.register));
authenticationRouter.patch('/register/activate', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.activateRegistrationPayloadValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.activateRegistration));
authenticationRouter.get('/username-availability', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.usernameAvailabilityQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.usernameAvailability));
authenticationRouter.post('/forgot-password', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.forgotPasswordPayloadValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.forgotPassword));
authenticationRouter.post('/forgot-password/verify', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.verifyForgotPasswordOTPPayloadValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.verifyForgotPasswordOTP));
authenticationRouter.patch('/forgot-password/reset', (0, request_validator_middleware_1.validateDataMiddleware)(authValidator.resetPasswordPayloadValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.resetPassword));
exports.default = authenticationRouter;
//# sourceMappingURL=routes.js.map