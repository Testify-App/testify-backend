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
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const controller_1 = __importDefault(require("../posts/controller"));
const controller_2 = __importDefault(require("../profiles/controller"));
const postsValidator = __importStar(require("../posts/validator"));
const request_validator_middleware_1 = require("../../shared/middlewares/request-validator.middleware");
const guestRouter = (0, express_1.Router)();
guestRouter.get('/posts', (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getGuestPosts));
guestRouter.get('/profiles/:username', (0, watch_async_controller_1.WatchAsyncController)(controller_2.default.getGuestProfile));
guestRouter.get('/users/:userId/posts', (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.userIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getPostsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getGuestPostsByUserId));
exports.default = guestRouter;
//# sourceMappingURL=routes.js.map