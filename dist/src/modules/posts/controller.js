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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const logger_1 = __importDefault(require("../../shared/services/logger"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class PostsController {
    constructor() {
        this.createPost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.CreatePostDTO(req.body);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.createPost(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Post created successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Post created successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.getPosts = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const query = new dtos.GetPostsQueryDTO(req.query);
            query.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getPosts(query);
            if (response instanceof errors_1.InternalServerErrorException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
            }
            logger_1.default.info('Posts retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Posts retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getPost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const query = new dtos.GetPostQueryDTO(req.params);
            const response = yield services_1.default.getPost(query);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Post retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Post retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.updatePost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.UpdatePostDTO(req.body);
            payload.post_id = req.params.post_id;
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.updatePost(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Post updated successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Post updated successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.deletePost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.DeletePostDTO(req.params);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.deletePost(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Post deleted successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.likePost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.GetPostQueryDTO(req.params);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.likePost(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Post liked successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.unlikePost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.GetPostQueryDTO(req.params);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.unlikePost(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Post unliked successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.repost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.GetPostQueryDTO(req.params);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.repost(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Post reposted successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.unrepost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.GetPostQueryDTO(req.params);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.unrepost(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Repost removed successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.quoteRepost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            let payload = new dtos.CreatePostDTO(req.body);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.quoteRepost(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Quote repost created successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Quote repost created successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.bookmarkPost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const postId = req.params.id;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.bookmarkPost(userId, postId);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Post bookmarked successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK, { is_bookmarked: response.is_bookmarked });
        });
        this.unbookmarkPost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const postId = req.params.id;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.unbookmarkPost(userId, postId);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Bookmark removed successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.getPostLikes = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.id;
            const query = new dtos.GetLikesQueryDTO(req.query);
            const response = yield services_1.default.getPostLikes(postId, query);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Post likes retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Post likes retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getPostReposts = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const postId = req.params.id;
            const query = new dtos.GetRepostsQueryDTO(req.query);
            const response = yield services_1.default.getPostReposts(postId, query);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Post reposts retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Post reposts retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.createComment = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.CreateCommentDTO(req.body);
            const postId = req.params.id;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.createComment(userId, postId, payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Comment created successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Comment created successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.getComments = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const postId = req.params.id;
            const query = new dtos.GetCommentsQueryDTO(req.query);
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getComments(userId, postId, query);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Comments retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'Comments retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.likeComment = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const commentId = req.params.id;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.likeComment(userId, commentId);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Comment liked successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK, { is_liked: response.is_liked });
        });
        this.unlikeComment = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const commentId = req.params.id;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.unlikeComment(userId, commentId);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Comment unliked successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, response.message, http_status_codes_1.StatusCodes.OK);
        });
        this.getUserPosts = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const targetUserId = req.params.userId;
            const query = new dtos.GetPostsQueryDTO(req.query);
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getUserPosts(userId, targetUserId, query);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('User posts retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'User posts retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getUserBookmarks = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const query = new dtos.GetPostsQueryDTO(req.query);
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getUserBookmarks(userId, query);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'posts.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('User bookmarks retrieved successfully', 'posts.controller.ts');
            return ResponseBuilder.success(res, 'User bookmarks retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
    }
}
exports.PostsController = PostsController;
const postsController = new PostsController();
exports.default = postsController;
//# sourceMappingURL=controller.js.map