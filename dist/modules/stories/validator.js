"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoryViewersValidator = exports.storyIdValidator = exports.createStoryValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createStoryValidator = joi_1.default.object({
    content_type: joi_1.default.string().valid('text', 'image', 'video').required(),
    media_url: joi_1.default.string().uri().when('content_type', {
        is: joi_1.default.valid('image', 'video'),
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional(),
    }),
    thumbnail_url: joi_1.default.string().uri().optional(),
    text_content: joi_1.default.string().max(500).when('content_type', {
        is: 'text',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional(),
    }),
    background_style: joi_1.default.object().optional(),
    duration: joi_1.default.number().integer().min(0).max(60).optional(),
});
exports.storyIdValidator = joi_1.default.object({
    storyId: joi_1.default.string().required(),
});
exports.getStoryViewersValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
//# sourceMappingURL=validator.js.map