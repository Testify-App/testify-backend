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
exports.PostsRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
class PostsRepositoryImpl {
    createPost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    let postType = 'text';
                    if (payload.media_attachments && payload.media_attachments.length > 0) {
                        const types = new Set(payload.media_attachments.map(m => m.type));
                        if (types.size === 1) {
                            postType = types.values().next().value;
                        }
                        else {
                            postType = 'mixed';
                        }
                    }
                    if (payload.parent_post_id) {
                        const parentPost = yield t.oneOrNone(query_1.default.getPostById, [payload.parent_post_id]);
                        if (!parentPost) {
                            throw new errors_1.BadException('Parent post not found');
                        }
                    }
                    const post = yield t.one(query_1.default.createPost, [
                        payload.user_id,
                        payload.content || null,
                        postType,
                        payload.visibility || 'public',
                        JSON.stringify(payload.media_attachments || []),
                        payload.parent_post_id || null,
                        payload.quote_text || null,
                    ]);
                    if (payload.parent_post_id) {
                        yield t.none('UPDATE posts SET quotes_count = quotes_count + 1 WHERE id = $1', [payload.parent_post_id]);
                    }
                    if (payload.content) {
                        const mentions = this.extractMentions(payload.content);
                        for (const mentionedUserId of mentions) {
                            yield t.none(query_1.default.createPostMention, [post.id, mentionedUserId, 'content']);
                        }
                    }
                    return new entities.PostEntity(post);
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    getPosts(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id } = payload;
                const [{ count }, posts] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getPostsFeed,
                    params: [user_id],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    posts: posts,
                };
            }
            catch (error) {
                return new errors_1.InternalServerErrorException(`${error.message}`);
            }
        });
    }
    ;
    getPost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('payload post id', payload);
                const post = yield database_1.db.oneOrNone(query_1.default.getPostWithEngagement, [payload.post_id]);
                if (!post) {
                    return new errors_1.NotFoundException('Post not found');
                }
                return new entities.PostWithUserEntity(post);
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    updatePost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const isOwner = yield t.one(query_1.default.isPostOwner, [
                        payload.post_id, payload.user_id
                    ]);
                    if (!isOwner.exists) {
                        throw new errors_1.BadException('Post not found or you do not have permission to update it');
                    }
                    const post = yield t.one(query_1.default.updatePost, [
                        payload.post_id,
                        payload.content || null,
                        payload.visibility || null,
                        payload.media_attachments ? JSON.stringify(payload.media_attachments) : null,
                    ]);
                    return new entities.PostEntity(post);
                }));
                return response;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    deletePost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const isOwner = yield t.one(query_1.default.isPostOwner, [payload.post_id, payload.user_id]);
                    if (!isOwner.exists) {
                        throw new errors_1.NotFoundException('Post not found or you do not have permission to delete it');
                    }
                    yield t.none(query_1.default.softDeletePost, [payload.post_id, payload.user_id]);
                    return { message: 'Post deleted successfully' };
                }));
                return response;
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    likePost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [payload.post_id]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    const existingLike = yield t.oneOrNone('SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2', [payload.post_id, payload.user_id]);
                    if (existingLike) {
                        return { message: 'Post already liked', is_liked: true };
                    }
                    yield t.none(query_1.default.likePost, [payload.post_id, payload.user_id]);
                    yield t.none(query_1.default.incrementPostCounter, [payload.post_id]);
                    return { message: 'Post liked successfully', is_liked: true };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    unlikePost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [postId]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    const existingLike = yield t.oneOrNone('SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                    if (!existingLike) {
                        return { message: 'Post not liked yet' };
                    }
                    yield t.none(query_1.default.unlikePost, [postId, userId]);
                    yield t.none(query_1.default.decrementPostCounter, [postId]);
                    return { message: 'Post unliked successfully' };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    repost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [postId]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    const existingRepost = yield t.oneOrNone('SELECT id FROM reposts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                    if (existingRepost) {
                        return { message: 'Post already reposted', is_reposted: true };
                    }
                    yield t.none(query_1.default.repost, [postId, userId]);
                    yield t.none('UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = $1', [postId]);
                    return { message: 'Post reposted successfully', is_reposted: true };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    unrepost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [postId]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    const existingRepost = yield t.oneOrNone('SELECT id FROM reposts WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                    if (!existingRepost) {
                        return { message: 'Post not reposted yet' };
                    }
                    yield t.none(query_1.default.unrepost, [postId, userId]);
                    yield t.none('UPDATE posts SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = $1', [postId]);
                    return { message: 'Repost removed successfully' };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    quoteRepost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!payload.parent_post_id) {
                return new errors_1.BadException('Parent post ID is required for quote repost');
            }
            return yield this.createPost(payload);
        });
    }
    bookmarkPost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [postId]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    const existingBookmark = yield t.oneOrNone('SELECT id FROM post_bookmarks WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                    if (existingBookmark) {
                        return { message: 'Post already bookmarked', is_bookmarked: true };
                    }
                    yield t.none(query_1.default.bookmarkPost, [postId, userId]);
                    return { message: 'Post bookmarked successfully', is_bookmarked: true };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    unbookmarkPost(userId, postId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [postId]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    const existingBookmark = yield t.oneOrNone('SELECT id FROM post_bookmarks WHERE post_id = $1 AND user_id = $2', [postId, userId]);
                    if (!existingBookmark) {
                        return { message: 'Post not bookmarked yet' };
                    }
                    yield t.none(query_1.default.unbookmarkPost, [postId, userId]);
                    return { message: 'Bookmark removed successfully' };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getPostLikes(postId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield database_1.db.oneOrNone(query_1.default.getPostById, [postId]);
                if (!post) {
                    return new errors_1.NotFoundException('Post not found');
                }
                const { page = '1', limit = '20' } = query;
                const [{ count }, likes] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getPostLikes,
                    params: [postId],
                });
                return {
                    likes: likes.map((l) => new entities.PostLikeEntity(l)),
                    pagination: { page: String(page), limit: String(limit), total: count, totalPages: (0, helpers_1.calcPages)(count, limit) },
                };
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getPostReposts(postId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield database_1.db.oneOrNone(query_1.default.getPostById, [postId]);
                if (!post) {
                    return new errors_1.NotFoundException('Post not found');
                }
                const { page = '1', limit = '20' } = query;
                const [{ count }, reposts] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getPostReposts,
                    params: [postId],
                });
                return {
                    reposts: reposts.map((r) => new entities.RepostEntity(r)),
                    pagination: { page: String(page), limit: String(limit), total: count, totalPages: (0, helpers_1.calcPages)(count, limit) },
                };
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    createComment(userId, postId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const post = yield t.oneOrNone(query_1.default.getPostById, [postId]);
                    if (!post) {
                        throw new errors_1.NotFoundException('Post not found');
                    }
                    if (payload.parent_comment_id) {
                        const parentComment = yield t.oneOrNone(query_1.default.getCommentById, [payload.parent_comment_id]);
                        if (!parentComment) {
                            throw new errors_1.NotFoundException('Parent comment not found');
                        }
                    }
                    const comment = yield t.one(query_1.default.createComment, [
                        postId,
                        userId,
                        payload.parent_comment_id || null,
                        payload.content,
                        JSON.stringify(payload.media_attachments || []),
                    ]);
                    yield t.none(query_1.default.incrementPostCommentsCounter, [postId]);
                    return new entities.CommentEntity(comment);
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getComments(userId, postId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const post = yield database_1.db.oneOrNone(query_1.default.getPostById, [postId]);
                if (!post) {
                    return new errors_1.NotFoundException('Post not found');
                }
                const { page = '1', limit = '20' } = query;
                const [{ count }, comments] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getPostComments,
                    params: [postId],
                });
                const commentsWithEngagement = yield Promise.all(comments.map((comment) => __awaiter(this, void 0, void 0, function* () {
                    const isLiked = yield database_1.db.one(query_1.default.isCommentLiked, [comment.id, userId]);
                    return new entities.CommentWithUserEntity(Object.assign(Object.assign({}, comment), { is_liked: isLiked.exists, user: {
                            id: comment.user_id,
                            username: comment.username,
                            avatar: comment.avatar,
                        } }));
                })));
                return {
                    comments: commentsWithEngagement,
                    pagination: { page: String(page), limit: String(limit), total: count, totalPages: (0, helpers_1.calcPages)(count, limit) },
                };
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    likeComment(userId, commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const comment = yield t.oneOrNone(query_1.default.getCommentById, [commentId]);
                    if (!comment) {
                        throw new errors_1.NotFoundException('Comment not found');
                    }
                    const existingLike = yield t.oneOrNone('SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
                    if (existingLike) {
                        return { message: 'Comment already liked', is_liked: true };
                    }
                    yield t.none(query_1.default.likeComment, [commentId, userId]);
                    yield t.none('UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1', [commentId]);
                    return { message: 'Comment liked successfully', is_liked: true };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    unlikeComment(userId, commentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const comment = yield t.oneOrNone(query_1.default.getCommentById, [commentId]);
                    if (!comment) {
                        throw new errors_1.NotFoundException('Comment not found');
                    }
                    const existingLike = yield t.oneOrNone('SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2', [commentId, userId]);
                    if (!existingLike) {
                        return { message: 'Comment not liked yet' };
                    }
                    yield t.none(query_1.default.unlikeComment, [commentId, userId]);
                    yield t.none('UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', [commentId]);
                    return { message: 'Comment unliked successfully' };
                }));
                return response;
            }
            catch (error) {
                if (error instanceof errors_1.NotFoundException) {
                    return error;
                }
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getUserPosts(userId, targetUserId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20' } = query;
                const [{ count }, posts] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getUserPosts,
                    params: [targetUserId],
                });
                const postsWithEngagement = yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
                    const isLiked = yield database_1.db.one(query_1.default.isPostLiked, [post.id, userId]);
                    const isReposted = yield database_1.db.one(query_1.default.isReposted, [post.id, userId]);
                    const isBookmarked = yield database_1.db.one(query_1.default.isBookmarked, [post.id, userId]);
                    return new entities.PostWithUserEntity(Object.assign(Object.assign({}, post), { is_liked: isLiked.exists, is_reposted: isReposted.exists, is_bookmarked: isBookmarked.exists, user: {
                            id: post.user_id,
                            username: post.username,
                            avatar: post.avatar,
                        } }));
                })));
                return {
                    posts: postsWithEngagement,
                    pagination: { page: String(page), limit: String(limit), total: count, totalPages: (0, helpers_1.calcPages)(count, limit) },
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getUserBookmarks(userId, query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20' } = query;
                const [{ count }, posts] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getUserBookmarks,
                    params: [userId],
                });
                const postsWithEngagement = yield Promise.all(posts.map((post) => __awaiter(this, void 0, void 0, function* () {
                    const isLiked = yield database_1.db.one(query_1.default.isPostLiked, [post.id, userId]);
                    const isReposted = yield database_1.db.one(query_1.default.isReposted, [post.id, userId]);
                    const isBookmarked = yield database_1.db.one(query_1.default.isBookmarked, [post.id, userId]);
                    return new entities.PostWithUserEntity(Object.assign(Object.assign({}, post), { is_liked: isLiked.exists, is_reposted: isReposted.exists, is_bookmarked: isBookmarked.exists, user: {
                            id: post.user_id,
                            username: post.username,
                            avatar: post.avatar,
                        } }));
                })));
                return {
                    posts: postsWithEngagement,
                    pagination: { page: String(page), limit: String(limit), total: count, totalPages: (0, helpers_1.calcPages)(count, limit) },
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    extractMentions(content) {
        const mentionRegex = /@([a-zA-Z0-9_]+)/g;
        const mentions = content.match(mentionRegex);
        if (!mentions) {
            return [];
        }
        return mentions.map(m => m.substring(1));
    }
}
exports.PostsRepositoryImpl = PostsRepositoryImpl;
const postsRepository = new PostsRepositoryImpl();
exports.default = postsRepository;
//# sourceMappingURL=repositories.js.map