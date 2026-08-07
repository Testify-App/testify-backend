"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommunityTestimoniesValidator = exports.createCommunityPostValidator = exports.communityReportParamsValidator = exports.communityTestimonyParamsValidator = exports.communityUserParamsValidator = exports.reviewReportValidator = exports.reportValidator = exports.banMemberValidator = exports.getCommunityMembersValidator = exports.deleteCommunityValidator = exports.updateCommunityValidator = exports.getMyCommunitiesValidator = exports.communityIdValidator = exports.createCommunityValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const ruleSchema = joi_1.default.object({
    text: joi_1.default.string().max(200).required(),
});
exports.createCommunityValidator = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(1000).optional(),
    category: joi_1.default.string().max(100).optional(),
    avatar: joi_1.default.string().uri().optional(),
    cover_image: joi_1.default.string().uri().optional(),
    visibility: joi_1.default.string().valid('public', 'private').optional().default('public'),
    rules: joi_1.default.array().items(ruleSchema).max(20).optional().default([]),
});
exports.communityIdValidator = joi_1.default.object({
    communityId: joi_1.default.string().required(),
});
exports.getMyCommunitiesValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.updateCommunityValidator = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).optional(),
    description: joi_1.default.string().max(1000).optional().allow(''),
    category: joi_1.default.string().max(100).optional().allow(''),
    avatar: joi_1.default.string().uri().optional().allow(''),
    cover_image: joi_1.default.string().uri().optional().allow(''),
    visibility: joi_1.default.string().valid('public', 'private').optional(),
    rules: joi_1.default.array().items(ruleSchema).max(20).optional(),
});
exports.deleteCommunityValidator = joi_1.default.object({
    confirm: joi_1.default.string().valid('DELETE').required().messages({
        'any.only': 'You must type DELETE to confirm',
    }),
});
exports.getCommunityMembersValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.banMemberValidator = joi_1.default.object({
    reason: joi_1.default.string().max(500).optional(),
});
exports.reportValidator = joi_1.default.object({
    reason: joi_1.default.string().max(500).optional(),
});
exports.reviewReportValidator = joi_1.default.object({
    status: joi_1.default.string().valid('reviewed', 'dismissed').required(),
});
exports.communityUserParamsValidator = joi_1.default.object({
    communityId: joi_1.default.string().required(),
    userId: joi_1.default.string().required(),
});
exports.communityTestimonyParamsValidator = joi_1.default.object({
    communityId: joi_1.default.string().required(),
    testimonyId: joi_1.default.string().required(),
});
exports.communityReportParamsValidator = joi_1.default.object({
    communityId: joi_1.default.string().required(),
    reportId: joi_1.default.string().required(),
});
const mediaAttachmentSchema = joi_1.default.object({
    type: joi_1.default.string().valid('image', 'video', 'audio').required(),
    url: joi_1.default.string().uri().required(),
    thumbnail_url: joi_1.default.string().uri().optional(),
    duration: joi_1.default.number().optional(),
    size: joi_1.default.number().optional(),
    mime_type: joi_1.default.string().optional(),
    filename: joi_1.default.string().optional(),
    order_index: joi_1.default.number().integer().optional(),
});
exports.createCommunityPostValidator = joi_1.default.object({
    content: joi_1.default.string().max(5000).optional().allow(''),
    media_attachments: joi_1.default.array().items(mediaAttachmentSchema).max(10).optional(),
}).or('content', 'media_attachments');
exports.getCommunityTestimoniesValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
//# sourceMappingURL=validator.js.map