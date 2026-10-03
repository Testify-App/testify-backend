"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPreferencesValidator = exports.notificationIdParamsValidator = exports.getNotificationsQueryValidator = void 0;
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
const filterValueSchema = joi_1.default.string().valid(...VALID_FILTERS);
exports.getNotificationsQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    filter: joi_1.default.alternatives()
        .try(filterValueSchema, joi_1.default.string().custom((value, helpers) => {
        const parts = value.split(',').map((v) => v.trim());
        for (const part of parts) {
            if (!VALID_FILTERS.includes(part)) {
                return helpers.error('any.only');
            }
        }
        return value;
    }), joi_1.default.array().items(filterValueSchema))
        .optional(),
});
exports.notificationIdParamsValidator = joi_1.default.object({
    notificationId: joi_1.default.string().uuid().required(),
});
exports.updateNotificationPreferencesValidator = joi_1.default.object({
    likes: joi_1.default.boolean().optional(),
    comments_replies: joi_1.default.boolean().optional(),
    mentions: joi_1.default.boolean().optional(),
    new_followers: joi_1.default.boolean().optional(),
    reposts: joi_1.default.boolean().optional(),
    circle_activity: joi_1.default.boolean().optional(),
}).min(1);
//# sourceMappingURL=validator.js.map