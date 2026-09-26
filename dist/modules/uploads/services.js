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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimits = exports.confirmUpload = exports.presignUpload = void 0;
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
const ttlFor = (kind) => { var _a; return Number((_a = process.env.UPLOAD_URL_TTL_SECONDS) !== null && _a !== void 0 ? _a : validator_1.URL_TTL_SECONDS[kind]); };
const FINAL_PREFIX = {
    post: 'posts',
    profile: 'profile',
};
const presignUpload = (userId, purpose, contentType, contentLength) => __awaiter(void 0, void 0, void 0, function* () {
    const media = validator_1.MEDIA_TYPES[contentType];
    if (!media) {
        throw new Error(`unsupported content type: ${contentType}`);
    }
    if (!validator_1.ALLOWED_KINDS[purpose].includes(media.kind)) {
        throw new Error(`${media.kind} is not allowed for ${purpose} (allowed: ${validator_1.ALLOWED_KINDS[purpose].join(', ')})`);
    }
    const maxBytes = validator_1.MAX_BYTES[media.kind];
    if (contentLength < 1 || contentLength > maxBytes) {
        throw new Error(`${media.kind} uploads must be between 1 and ${maxBytes} bytes (got ${contentLength})`);
    }
    const key = `tmp/${userId}/${purpose}-${(0, crypto_1.randomUUID)()}.${media.ext}`;
    const uploadUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_2.PutObjectCommand({
        Bucket: BUCKET(),
        Key: key,
        ContentType: contentType,
        ContentLength: contentLength,
    }), {
        expiresIn: ttlFor(media.kind),
        signableHeaders: new Set(['content-type']),
    });
    return {
        uploadUrl,
        key,
        expiresIn: ttlFor(media.kind),
        maxBytes,
        kind: media.kind,
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
    const media = validator_1.MEDIA_TYPES[contentType];
    if (!media) {
        yield s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(`rejected object with content type: ${contentType}`);
    }
    if (bytes < 1 || bytes > validator_1.MAX_BYTES[media.kind]) {
        yield s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: bucket, Key: key }));
        throw new Error(`rejected ${media.kind} object of ${bytes} bytes`);
    }
    const filename = key.slice(`tmp/${userId}/`.length);
    const purpose = validator_1.UPLOAD_PURPOSES.find((p) => filename.startsWith(`${p}-`));
    if (!purpose) {
        throw new Error('key does not encode a recognised upload purpose');
    }
    const extension = media.ext;
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
        kind: media.kind,
    };
});
exports.confirmUpload = confirmUpload;
const uploadLimits = () => ({
    maxBytes: validator_1.MAX_BYTES,
    allowedKinds: validator_1.ALLOWED_KINDS,
    contentTypes: Object.fromEntries(Object.entries(validator_1.MEDIA_TYPES).map(([type, m]) => [type, m.kind])),
    urlTtlSeconds: validator_1.URL_TTL_SECONDS,
});
exports.uploadLimits = uploadLimits;
exports.default = { presignUpload: exports.presignUpload, confirmUpload: exports.confirmUpload, uploadLimits: exports.uploadLimits };
//# sourceMappingURL=services.js.map