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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsRepositoryImpl = void 0;
const uuid_1 = require("uuid");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const s3_1 = require("../../config/s3");
const entities_1 = require("./entities");
const errors_1 = require("../../shared/lib/errors");
const PRESIGN_EXPIRY_SECONDS = 60;
class UploadsRepositoryImpl {
    createPresignedUpload(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rule = entities_1.UPLOAD_CONTEXT_RULES[payload.context];
                if (!rule) {
                    return new errors_1.BadException('Invalid upload context');
                }
                if (!rule.allowedMimeTypes.includes(payload.content_type)) {
                    return new errors_1.BadException(`Unsupported content type for ${payload.context}. Allowed: ${rule.allowedMimeTypes.join(', ')}`);
                }
                const extension = (0, entities_1.extensionForMimeType)(payload.content_type);
                if (!extension) {
                    return new errors_1.BadException('Unsupported content type');
                }
                const key = `${rule.keyPrefix}/${payload.user_id}/${(0, uuid_1.v4)()}.${extension}`;
                const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3_1.s3Client, {
                    Bucket: (0, s3_1.S3_BUCKET)(),
                    Key: key,
                    Conditions: [
                        ['content-length-range', 0, rule.maxSizeBytes],
                        ['eq', '$Content-Type', payload.content_type],
                    ],
                    Fields: {
                        'Content-Type': payload.content_type,
                    },
                    Expires: PRESIGN_EXPIRY_SECONDS,
                });
                return {
                    url,
                    fields,
                    key,
                    public_url: `${(0, s3_1.S3_PUBLIC_BASE_URL)()}/${key}`,
                    expires_in: PRESIGN_EXPIRY_SECONDS,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.UploadsRepositoryImpl = UploadsRepositoryImpl;
const UploadsRepository = new UploadsRepositoryImpl();
exports.default = UploadsRepository;
//# sourceMappingURL=repositories.js.map