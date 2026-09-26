"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmUploadValidator = exports.presignUploadValidator = exports.URL_TTL_SECONDS = exports.ALLOWED_KINDS = exports.MAX_BYTES = exports.ALLOWED_CONTENT_TYPES = exports.MEDIA_TYPES = exports.UPLOAD_PURPOSES = void 0;
const joi_1 = __importDefault(require("joi"));
exports.UPLOAD_PURPOSES = ['post', 'profile'];
exports.MEDIA_TYPES = {
    'image/jpeg': { kind: 'image', ext: 'jpg' },
    'image/png': { kind: 'image', ext: 'png' },
    'image/webp': { kind: 'image', ext: 'webp' },
    'video/mp4': { kind: 'video', ext: 'mp4' },
    'video/quicktime': { kind: 'video', ext: 'mov' },
    'video/webm': { kind: 'video', ext: 'webm' },
    'audio/mpeg': { kind: 'audio', ext: 'mp3' },
    'audio/mp4': { kind: 'audio', ext: 'm4a' },
    'audio/aac': { kind: 'audio', ext: 'aac' },
};
exports.ALLOWED_CONTENT_TYPES = Object.keys(exports.MEDIA_TYPES);
exports.MAX_BYTES = {
    image: 10 * 1024 * 1024,
    audio: 25 * 1024 * 1024,
    video: 100 * 1024 * 1024,
};
exports.ALLOWED_KINDS = {
    post: ['image', 'video', 'audio'],
    profile: ['image'],
};
exports.URL_TTL_SECONDS = {
    image: 300,
    audio: 600,
    video: 900,
};
const GLOBAL_MAX_BYTES = Math.max(...Object.values(exports.MAX_BYTES));
exports.presignUploadValidator = joi_1.default.object({
    purpose: joi_1.default.string()
        .valid(...exports.UPLOAD_PURPOSES)
        .required(),
    contentType: joi_1.default.string()
        .valid(...exports.ALLOWED_CONTENT_TYPES)
        .required()
        .messages({
        'any.only': `contentType must be one of: ${exports.ALLOWED_CONTENT_TYPES.join(', ')}`,
    }),
    contentLength: joi_1.default.number()
        .integer()
        .min(1)
        .max(GLOBAL_MAX_BYTES)
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