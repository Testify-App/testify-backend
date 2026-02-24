"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProfilePostHistoryByIdValidator = exports.searchProfilesByUsernameValidator = exports.getCircleMembersValidator = exports.rejectCircleRequestValidator = exports.acceptCircleRequestValidator = exports.sendCircleRequestValidator = exports.unfollowValidator = exports.getTribeMembersValidator = exports.addToTribeValidator = exports.getByUsernameValidator = exports.updateProfileValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateProfileValidator = joi_1.default.object({
    first_name: joi_1.default.string().max(100).optional(),
    last_name: joi_1.default.string().max(100).optional(),
    country_code: joi_1.default.string().max(10).optional(),
    phone_number: joi_1.default.string().max(20).optional(),
    avatar: joi_1.default.string().uri().optional(),
    username: joi_1.default.string().alphanum().min(3).max(30).optional(),
    display_name: joi_1.default.string().max(30).optional(),
    header_image: joi_1.default.string().uri().optional(),
    bio: joi_1.default.string().max(500).optional(),
    instagram: joi_1.default.string().uri().optional(),
    youtube: joi_1.default.string().uri().optional(),
    twitter: joi_1.default.string().uri().optional(),
});
exports.getByUsernameValidator = joi_1.default.object({
    username: joi_1.default.string().alphanum().min(3).max(30).required(),
});
exports.addToTribeValidator = joi_1.default.object({
    following_id: joi_1.default.string().required(),
});
exports.getTribeMembersValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.unfollowValidator = joi_1.default.object({
    confirm: joi_1.default.boolean().optional().default(false),
});
exports.sendCircleRequestValidator = joi_1.default.object({
    connected_user_id: joi_1.default.string().required(),
});
exports.acceptCircleRequestValidator = joi_1.default.object({
    request_id: joi_1.default.string().required(),
});
exports.rejectCircleRequestValidator = joi_1.default.object({
    request_id: joi_1.default.string().required(),
});
exports.getCircleMembersValidator = joi_1.default.object({
    search: joi_1.default.string().min(1).max(100).optional(),
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.searchProfilesByUsernameValidator = joi_1.default.object({
    search: joi_1.default.string().min(1).max(100).required(),
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.fetchProfilePostHistoryByIdValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
//# sourceMappingURL=validator.js.map