"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmUploadValidator = exports.presignUploadValidator = exports.MAX_UPLOAD_BYTES = exports.ALLOWED_CONTENT_TYPES = exports.UPLOAD_PURPOSES = void 0;
const joi_1 = __importDefault(require("joi"));
exports.UPLOAD_PURPOSES = ['post', 'profile'];
exports.ALLOWED_CONTENT_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
];
exports.MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
exports.presignUploadValidator = joi_1.default.object({
    purpose: joi_1.default.string()
        .valid(...exports.UPLOAD_PURPOSES)
        .required(),
    contentType: joi_1.default.string()
        .valid(...exports.ALLOWED_CONTENT_TYPES)
        .required(),
    contentLength: joi_1.default.number()
        .integer()
        .min(1)
        .max(exports.MAX_UPLOAD_BYTES)
        .required(),
});
exports.confirmUploadValidator = joi_1.default.object({
    key: joi_1.default.string()
        .max(512)
        .pattern(/^tmp\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+$/)
        .required()
        .messages({
        'string.pattern.base': 'key must be an upload key previously issued by /uploads/presign',
    }),
});
//# sourceMappingURL=validator.js.map