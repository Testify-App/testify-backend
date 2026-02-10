"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateProfileValidator = joi_1.default.object({
    first_name: joi_1.default.string().max(100).optional(),
    last_name: joi_1.default.string().max(100).optional(),
    country_code: joi_1.default.string().max(10).optional(),
    phone_number: joi_1.default.string().max(20).optional(),
    avatar: joi_1.default.string().uri().optional(),
    username: joi_1.default.string().alphanum().min(3).max(30).optional(),
    bio: joi_1.default.string().max(500).optional(),
    instagram: joi_1.default.string().uri().optional(),
    youtube: joi_1.default.string().uri().optional(),
    twitter: joi_1.default.string().uri().optional(),
});
//# sourceMappingURL=validator.js.map