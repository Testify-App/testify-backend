"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationIdParamsValidator = exports.getNotificationsQueryValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const VALID_FILTERS = [
    'all',
    'mentions',
    'likes',
    'comments',
    'circle_requests',
    'follows',
    'moderation',
];
exports.getNotificationsQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    filter: joi_1.default.string().valid(...VALID_FILTERS).optional(),
});
exports.notificationIdParamsValidator = joi_1.default.object({
    notificationId: joi_1.default.string().uuid().required(),
});
//# sourceMappingURL=validator.js.map