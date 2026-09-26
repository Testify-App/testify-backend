"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPresignedUploadValidator = void 0;
const joi_1 = __importDefault(require("joi"));
const entities_1 = require("./entities");
exports.createPresignedUploadValidator = joi_1.default.object({
    context: joi_1.default.string().valid(...Object.keys(entities_1.UPLOAD_CONTEXT_RULES)).required(),
    content_type: joi_1.default.string().required(),
});
//# sourceMappingURL=validator.js.map