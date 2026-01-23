"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const development = {
    NODE_ENV: process.env.TESTIFY_NODE_ENV,
    PORT: process.env.TESTIFY_PORT,
    DATABASE_URL: process.env.TESTIFY_DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CRYPTO_SECRET: process.env.TESTIFY_CRYPTO_SECRET,
    CRYPTO_TIME_STEP: process.env.TESTIFY_CRYPTO_TIME_STEP,
    CRYPTO_OTP_LENGTH: process.env.TESTIFY_CRYPTO_OTP_LENGTH,
    CRYPTO_HASH_ALGO: process.env.TESTIFY_CRYPTO_HASH_ALGO,
    SALT_ROUND: process.env.TESTIFY_SALT_ROUND,
    MAIL_FROM: process.env.TESTIFY_MAIL_FROM,
    MAIL_API_KEY: process.env.TESTIFY_MAILJET_API_KEY,
    MAIL_API_SECRET: process.env.TESTIFY_MAILJET_API_SECRET,
    REDIS_URL: process.env.TESTIFY_REDIS_URL,
};
exports.default = development;
//# sourceMappingURL=development.js.map