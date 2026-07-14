"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchQueryValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.searchQueryValidator = joi_1.default.object({
    q: joi_1.default.string().min(1).max(100).required(),
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
});
//# sourceMappingURL=validator.js.map