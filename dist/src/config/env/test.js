"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const test = {
    NODE_ENV: process.env.KOINS_NODE_ENV,
    PORT: process.env.KOINS_PORT,
    DATABASE_URL: process.env.KOINS_TEST_DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    CRYPTO_SECRET: process.env.KOINS_TEST_CRYPTO_SECRET,
    CRYPTO_TIME_STEP: process.env.KOINS_TEST_CRYPTO_TIME_STEP,
    CRYPTO_OTP_LENGTH: process.env.KOINS_TEST_CRYPTO_OTP_LENGTH,
    CRYPTO_HASH_ALGO: process.env.KOINS_TEST_CRYPTO_HASH_ALGO,
    SALT_ROUND: process.env.KOINS_TEST_SALT_ROUND,
    MAIL_FROM: process.env.KOINS_TEST_MAIL_FROM,
    MAIL_API_KEY: process.env.KOINS_TEST_MAILJET_API_KEY,
    MAIL_API_SECRET: process.env.KOINS_TEST_MAILJET_API_SECRET,
    REDIS_URL: process.env.KOINS_REDIS_URL,
};
exports.default = test;
//# sourceMappingURL=test.js.map