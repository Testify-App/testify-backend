"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userIdValidator = exports.commentIdValidator = exports.postIdValidator = exports.getRepostsQueryValidator = exports.getLikesQueryValidator = exports.getCommentsQueryValidator = exports.getPostsQueryValidator = exports.createCommentValidator = exports.updatePostValidator = exports.createPostValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createPostValidator = joi_1.default.object({
    content: joi_1.default.string().min(1).max(5000).optional(),
    visibility: joi_1.default.string().valid('public', 'followers_only', 'mentioned_only', 'private').optional(),
    media_attachments: joi_1.default.array().max(10).items(joi_1.default.object({
        type: joi_1.default.string().valid('image', 'video', 'audio').required(),
        url: joi_1.default.string().uri().required(),
        thumbnail_url: joi_1.default.string().uri().optional(),
        duration: joi_1.default.number().optional(),
        size: joi_1.default.number().optional(),
        mime_type: joi_1.default.string().optional(),
        filename: joi_1.default.string().optional(),
        order_index: joi_1.default.number().optional(),
    })).optional(),
    parent_post_id: joi_1.default.string().uuid().optional(),
    quote_text: joi_1.default.string().min(1).max(500).optional(),
});
exports.updatePostValidator = joi_1.default.object({
    content: joi_1.default.string().min(1).max(5000).optional(),
    visibility: joi_1.default.string().valid('public', 'followers_only', 'mentioned_only', 'private').optional(),
    media_attachments: joi_1.default.array().max(10).items(joi_1.default.object({
        type: joi_1.default.string().valid('image', 'video', 'audio').required(),
        url: joi_1.default.string().uri().required(),
        thumbnail_url: joi_1.default.string().uri().optional(),
        duration: joi_1.default.number().optional(),
        size: joi_1.default.number().optional(),
        mime_type: joi_1.default.string().optional(),
        filename: joi_1.default.string().optional(),
        order_index: joi_1.default.number().optional(),
    })).optional(),
});
exports.createCommentValidator = joi_1.default.object({
    content: joi_1.default.string().min(1).max(1000).required(),
    parent_comment_id: joi_1.default.string().uuid().optional(),
    media_attachments: joi_1.default.array().max(4).items(joi_1.default.object({
        type: joi_1.default.string().valid('image', 'video', 'audio').required(),
        url: joi_1.default.string().uri().required(),
        thumbnail_url: joi_1.default.string().uri().optional(),
        duration: joi_1.default.number().optional(),
        size: joi_1.default.number().optional(),
        mime_type: joi_1.default.string().optional(),
        filename: joi_1.default.string().optional(),
        order_index: joi_1.default.number().optional(),
    })).optional(),
});
exports.getPostsQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    sort: joi_1.default.string().valid('created_at', 'likes_count', 'reposts_count').optional(),
    order: joi_1.default.string().valid('ASC', 'DESC', 'asc', 'desc').optional(),
    user_id: joi_1.default.string().uuid().optional(),
    visibility: joi_1.default.string().valid('public', 'followers_only', 'mentioned_only', 'private').optional(),
});
exports.getCommentsQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    sort: joi_1.default.string().valid('created_at', 'likes_count').optional(),
    order: joi_1.default.string().valid('ASC', 'DESC', 'asc', 'desc').optional(),
});
exports.getLikesQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.getRepostsQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.postIdValidator = joi_1.default.object({
    post_id: joi_1.default.string().uuid().required(),
});
exports.commentIdValidator = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
});
exports.userIdValidator = joi_1.default.object({
    userId: joi_1.default.string().uuid().required(),
});
//# sourceMappingURL=validator.js.map