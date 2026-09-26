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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmUpload = exports.presignUpload = void 0;
const crypto_1 = require("crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_s3_2 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const validator_1 = require("./validator");
const s3 = new client_s3_1.S3Client({
    region: (_b = (_a = process.env.AWS_S3_REGION) !== null && _a !== void 0 ? _a : process.env.AWS_REGION) !== null && _b !== void 0 ? _b : 'us-east-1',
});
const BUCKET = () => {
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
        throw new Error('AWS_S3_BUCKET is not set. It is supplied from Parameter Store at /testifyhub/prod/app/AWS_S3_BUCKET.');
    }
    return bucket;
};
const CDN_BASE = () => { var _a; return ((_a = process.env.CDN_BASE_URL) !== null && _a !== void 0 ? _a : 'https://cdn.testifyhub.co').replace(/\/+$/, ''); };
const URL_TTL_SECONDS = Number((_c = process.env.UPLOAD_URL_TTL_SECONDS) !== null && _c !== void 0 ? _c : 300);
const EXTENSION = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
const FINAL_PREFIX = {
    post: 'posts',
    profile: 'profile',
};
const presignUpload = (userId, purpose, contentType, contentLength) => __awaiter(void 0, void 0, void 0, function* () {
    if (!validator_1.ALLOWED_CONTENT_TYPES.includes(contentType)) {
        throw new Error(`unsupported content type: ${contentType}`);
    }
    if (contentLength < 1 || contentLength > validator_1.MAX_UPLOAD_BYTES) {
        throw new Error(`contentLength must be between 1 and ${validator_1.MAX_UPLOAD_BYTES}`);
    }
    const key = `tmp/${userId}/${purpose}-${(0, crypto_1.randomUUID)()}.${EXTENSION[contentType]}`;
    const uploadUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_2.PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
    }), {
        expiresIn: URL_TTL_SECONDS,
        signableHeaders: new Set(['content-type']),
    });
    return {
        uploadUrl,
        key,
        expiresIn: URL_TTL_SECONDS,
        maxBytes: validator_1.MAX_UPLOAD_BYTES,
        contentType,
    };
});
exports.presignUpload = presignUpload;
const confirmUpload = (userId, key) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!key.startsWith(`tmp/${userId}/`)) {
        throw new Error('key does not belong to the authenticated user');
    }
    const bucket = BUCKET();
    const head = yield s3.send(new client_s3_1.HeadObjectCommand({ Bucket: bucket, Key: key }));
    const contentType = (_a = head.ContentType) !== null && _a !== void 0 ? _a : '';
    const bytes = (_b = head.ContentLength) !== null && _b !== void 0 ? _b : 0;
    if (!validator_1.ALLOWED_CONTENT_TYPES.includes(contentType)) {
        yield s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(`rejected object with content type: ${contentType}`);
    }
    if (bytes < 1 || bytes > validator_1.MAX_UPLOAD_BYTES) {
        yield s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(`rejected object of ${bytes} bytes`);
    }
    const filename = key.slice(`tmp/${userId}/`.length);
    const purpose = validator_1.UPLOAD_PURPOSES.find((p) => filename.startsWith(`${p}-`));
    if (!purpose) {
        throw new Error('key does not encode a recognised upload purpose');
    }
    const extension = EXTENSION[contentType];
    const fingerprint = ((_c = head.ETag) !== null && _c !== void 0 ? _c : (0, crypto_1.randomUUID)()).replace(/"/g, '');
    const finalKey = `${FINAL_PREFIX[purpose]}/${userId}/${fingerprint}.${extension}`;
    yield s3.send(new client_s3_1.CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${key}`,
        Key: finalKey,
        ContentType: contentType,
        MetadataDirective: 'REPLACE',
    }));
    yield s3
        .send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key }))
        .catch(() => undefined);
    return {
        key: finalKey,
        url: `${CDN_BASE()}/${finalKey}`,
        bytes,
        contentType,
    };
});
exports.confirmUpload = confirmUpload;
exports.default = { presignUpload: exports.presignUpload, confirmUpload: exports.confirmUpload };
//# sourceMappingURL=services.js.map