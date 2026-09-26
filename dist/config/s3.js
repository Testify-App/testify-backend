"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_PUBLIC_BASE_URL = exports.S3_BUCKET = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = __importDefault(require("../shared/utils/env"));
exports.s3Client = new client_s3_1.S3Client({
    region: env_1.default.get('AWS_REGION'),
});
const S3_BUCKET = () => env_1.default.get('AWS_S3_BUCKET');
exports.S3_BUCKET = S3_BUCKET;
const S3_PUBLIC_BASE_URL = () => env_1.default.get('AWS_S3_PUBLIC_BASE_URL');
exports.S3_PUBLIC_BASE_URL = S3_PUBLIC_BASE_URL;
//# sourceMappingURL=s3.js.map