"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportIdValidator = exports.reviewReportValidator = exports.getReportsQueryValidator = exports.createReportValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createReportValidator = joi_1.default.object({
    entity_type: joi_1.default.string().valid('post', 'comment').required(),
    entity_id: joi_1.default.string().required(),
    reason: joi_1.default.string().max(200).required(),
    details: joi_1.default.string().max(1000).optional().allow(''),
});
exports.getReportsQueryValidator = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'under_review', 'resolved').optional(),
    entity_type: joi_1.default.string().valid('post', 'comment').optional(),
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.reviewReportValidator = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'under_review', 'resolved').required(),
    moderator_action: joi_1.default.string().valid('no_action', 'content_removed', 'user_action_taken').optional(),
});
exports.reportIdValidator = joi_1.default.object({
    reportId: joi_1.default.string().required(),
});
//# sourceMappingURL=validator.js.map