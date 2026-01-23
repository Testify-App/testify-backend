"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const joi_1 = __importDefault(require("joi"));
const env_1 = __importDefault(require("../../src/shared/utils/env"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
describe('Env Class', () => {
    const validationSchema = joi_1.default.object({
        NODE_ENV: joi_1.default.string()
            .valid('development', 'production', 'test')
            .required(),
        PORT: joi_1.default.number().default(3000),
        DATABASE_URL: joi_1.default.string().required(),
        PAPERTRAIL_HOST: joi_1.default.string().required(),
        PAPERTRAIL_PORT: joi_1.default.string().required(),
        JWT_SECRET: joi_1.default.string().required(),
        CRYPTO_SECRET: joi_1.default.string().required(),
        CRYPTO_TIME_STEP: joi_1.default.string().required(),
        CRYPTO_OTP_LENGTH: joi_1.default.string().required(),
        CRYPTO_HASH_ALGO: joi_1.default.string().required(),
        SALT_ROUND: joi_1.default.string().required(),
    });
    beforeEach(() => {
        process.env.NODE_ENV = 'development';
    });
    afterEach(() => {
        delete process.env.NODE_ENV;
    });
    it('should validate and set environment variables', () => __awaiter(void 0, void 0, void 0, function* () {
        yield env_1.default.validateEnv(validationSchema);
        (0, chai_1.expect)(env_1.default.get('NODE_ENV')).to.equal('test');
        (0, chai_1.expect)(env_1.default.get('PORT')).to.equal(Number(process.env.TEMPLATE_PORT));
    }));
    it('should fall back to default config for missing variables', () => __awaiter(void 0, void 0, void 0, function* () {
        yield env_1.default.validateEnv(validationSchema);
        (0, chai_1.expect)(env_1.default.get('NODE_ENV')).to.equal('test');
        (0, chai_1.expect)(env_1.default.get('PORT')).to.equal(Number(process.env.TEMPLATE_PORT));
    }));
});
//# sourceMappingURL=env.js.map