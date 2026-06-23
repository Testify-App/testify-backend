"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchQueryValidator = exports.trendingQueryValidator = exports.hashtagFeedQueryValidator = exports.hashtagParamValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.hashtagParamValidator = joi_1.default.object({
    tag: joi_1.default.string().alphanum().min(1).max(50).required(),
});
exports.hashtagFeedQueryValidator = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
exports.trendingQueryValidator = joi_1.default.object({
    limit: joi_1.default.number().integer().min(1).max(50).optional(),
});
exports.searchQueryValidator = joi_1.default.object({
    q: joi_1.default.string().alphanum().min(1).max(50).required(),
});
//# sourceMappingURL=validator.js.map