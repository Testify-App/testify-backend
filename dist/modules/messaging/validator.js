"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactToMessageValidator = exports.messageIdParamValidator = exports.markConversationReadValidator = exports.sendMessageValidator = exports.getMessagesQueryValidator = exports.conversationIdParamValidator = exports.getOrCreateConversationValidator = exports.getConversationsQueryValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.getConversationsQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.getOrCreateConversationValidator = joi_1.default.object({
    other_user_id: joi_1.default.string().required(),
});
exports.conversationIdParamValidator = joi_1.default.object({
    conversationId: joi_1.default.string().required(),
});
exports.getMessagesQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.sendMessageValidator = joi_1.default.object({
    content_type: joi_1.default.string().valid('text', 'image', 'video', 'audio').required(),
    content: joi_1.default.string().max(5000).when('content_type', { is: 'text', then: joi_1.default.required() }).optional(),
    media_url: joi_1.default.string().uri().when('content_type', { is: joi_1.default.valid('image', 'video', 'audio'), then: joi_1.default.required() }).optional(),
    reply_to_message_id: joi_1.default.string().optional(),
});
exports.markConversationReadValidator = joi_1.default.object({
    up_to_message_id: joi_1.default.string().required(),
});
exports.messageIdParamValidator = joi_1.default.object({
    messageId: joi_1.default.string().required(),
});
exports.reactToMessageValidator = joi_1.default.object({
    emoji: joi_1.default.string().max(16).required(),
});
//# sourceMappingURL=validator.js.map