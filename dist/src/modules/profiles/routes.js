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
const profilesValidator = __importStar(require("./validator"));
const controller_1 = __importDefault(require("./controller"));
const AuthenticationMiddleware = __importStar(require("../../shared/middlewares/auth.middleware"));
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const request_validator_middleware_1 = require("../../shared/middlewares/request-validator.middleware");
const verifyAuth = AuthenticationMiddleware.verifyAuthTokenMiddleware;
const profilesRouter = (0, express_1.Router)();
profilesRouter.get('/', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getProfile));
profilesRouter.put('/', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(profilesValidator.updateProfileValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.updateProfile));
profilesRouter.post('/tribe', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(profilesValidator.addToTribeValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.addToTribe));
profilesRouter.delete('/tribe/:userId', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.removeFromTribe));
profilesRouter.get('/tribe', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(profilesValidator.getTribeMembersValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getTribeMembers));
profilesRouter.get('/tribe/count', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getTribeCount));
profilesRouter.get('/tribe/is-member/:userId', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.isInTribe));
profilesRouter.post('/circle', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(profilesValidator.sendCircleRequestValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.sendCircleRequest));
profilesRouter.put('/circle/accept/:requestId', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.acceptCircleRequest));
profilesRouter.put('/circle/reject/:requestId', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.rejectCircleRequest));
profilesRouter.delete('/circle/:userId', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.removeFromCircle));
profilesRouter.get('/circle', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(profilesValidator.getCircleMembersValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getCircleMembers));
profilesRouter.get('/circle/count', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getCircleCount));
profilesRouter.get('/circle/is-member/:userId', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.isInCircle));
profilesRouter.get('/circle/requests', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getPendingRequests));
profilesRouter.get('/circle/requests/sent', verifyAuth, (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getSentRequests));
exports.default = profilesRouter;
//# sourceMappingURL=routes.js.map