"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidatorSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const enums_1 = require("./enums");
exports.envValidatorSchema = joi_1.default.object({
    PORT: joi_1.default.number().default(8000),
    NODE_ENV: joi_1.default.string()
        .required()
        .valid(enums_1.AppEnv.DEVELOPMENT, enums_1.AppEnv.TEST, enums_1.AppEnv.STAGING, enums_1.AppEnv.PRODUCTION)
        .default(enums_1.AppEnv.DEVELOPMENT),
    DATABASE_URL: joi_1.default.string().required(),
    REDIS_SESSION_STORE_URL: joi_1.default.string(),
    SWAGGER_ROUTE: joi_1.default.string().default('/api/docs'),
    MAIL_USERNAME: joi_1.default.string(),
    MAIL_PASSWORD: joi_1.default.string(),
}).unknown(true);
//# sourceMappingURL=env-validator.js.map