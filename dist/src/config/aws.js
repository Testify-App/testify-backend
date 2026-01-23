"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const env_1 = __importDefault(require("../shared/utils/env"));
const s3 = new aws_sdk_1.default.S3({
    region: env_1.default.get('AWS_S3_BUCKET_REGION'),
    credentials: {
        accessKeyId: env_1.default.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: env_1.default.get('AWS_SECRET_ACCESS_KEY'),
    },
    signatureVersion: 'v4',
    maxRetries: 3,
});
exports.default = s3;
//# sourceMappingURL=aws.js.map