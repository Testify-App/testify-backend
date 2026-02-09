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
const postsValidator = __importStar(require("./validator"));
const controller_1 = __importDefault(require("./controller"));
const AuthenticationMiddleware = __importStar(require("../../shared/middlewares/auth.middleware"));
const watch_async_controller_1 = require("../../shared/utils/watch-async-controller");
const request_validator_middleware_1 = require("../../shared/middlewares/request-validator.middleware");
const verifyAuth = AuthenticationMiddleware.verifyAuthTokenMiddleware;
const postsRouter = (0, express_1.Router)();
postsRouter.post('/', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.createPostValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.createPost));
postsRouter.get('/', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getPostsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getPosts));
postsRouter.get('/:post_id', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getPost));
postsRouter.put('/:post_id', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.updatePostValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.updatePost));
postsRouter.delete('/:post_id', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.deletePost));
postsRouter.post('/:post_id/like', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.likePost));
postsRouter.delete('/:id/like', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.unlikePost));
postsRouter.get('/:id/likes', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getLikesQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getPostLikes));
postsRouter.post('/:id/repost', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.repost));
postsRouter.delete('/:id/repost', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.unrepost));
postsRouter.get('/:id/reposts', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getRepostsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getPostReposts));
postsRouter.post('/:id/quote', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.createPostValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.quoteRepost));
postsRouter.post('/:id/bookmark', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.bookmarkPost));
postsRouter.delete('/:id/bookmark', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.unbookmarkPost));
postsRouter.post('/:id/comments', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.createCommentValidator, 'body'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.createComment));
postsRouter.get('/:id/comments', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.postIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getCommentsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getComments));
postsRouter.post('/comments/:id/like', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.commentIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.likeComment));
postsRouter.delete('/comments/:id/like', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.commentIdValidator, 'params'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.unlikeComment));
postsRouter.get('/user/:userId', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.userIdValidator, 'params'), (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getPostsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getUserPosts));
postsRouter.get('/bookmarks', verifyAuth, (0, request_validator_middleware_1.validateDataMiddleware)(postsValidator.getPostsQueryValidator, 'query'), (0, watch_async_controller_1.WatchAsyncController)(controller_1.default.getUserBookmarks));
exports.default = postsRouter;
//# sourceMappingURL=routes.js.map