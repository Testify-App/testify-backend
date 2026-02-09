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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
class PostsServiceImpl {
    constructor() {
        this.createPost = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.createPost(payload);
        });
        this.getPosts = (query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getPosts(query);
        });
        this.getPost = (query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getPost(query);
        });
        this.updatePost = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.updatePost(payload);
        });
        this.deletePost = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.deletePost(payload);
        });
        this.likePost = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.likePost(payload);
        });
        this.unlikePost = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.unlikePost(userId, postId);
        });
        this.repost = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.repost(userId, postId);
        });
        this.unrepost = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.unrepost(userId, postId);
        });
        this.quoteRepost = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.quoteRepost(payload);
        });
        this.bookmarkPost = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.bookmarkPost(userId, postId);
        });
        this.unbookmarkPost = (userId, postId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.unbookmarkPost(userId, postId);
        });
        this.getPostLikes = (postId, query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getPostLikes(postId, query);
        });
        this.getPostReposts = (postId, query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getPostReposts(postId, query);
        });
        this.createComment = (userId, postId, payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.createComment(userId, postId, payload);
        });
        this.getComments = (userId, postId, query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getComments(userId, postId, query);
        });
        this.likeComment = (userId, commentId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.likeComment(userId, commentId);
        });
        this.unlikeComment = (userId, commentId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.unlikeComment(userId, commentId);
        });
        this.getUserPosts = (userId, targetUserId, query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getUserPosts(userId, targetUserId, query);
        });
        this.getUserBookmarks = (userId, query) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getUserBookmarks(userId, query);
        });
    }
}
exports.PostsServiceImpl = PostsServiceImpl;
const PostsService = new PostsServiceImpl();
exports.default = PostsService;
//# sourceMappingURL=services.js.map