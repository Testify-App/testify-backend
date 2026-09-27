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
exports.deleteAsset = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("../../config/s3");
const env_1 = __importDefault(require("../utils/env"));
const deleteAsset = (url) => __awaiter(void 0, void 0, void 0, function* () {
    if (env_1.default.get('NODE_ENV') === 'test')
        return;
    const baseUrl = (0, s3_1.S3_PUBLIC_BASE_URL)();
    if (!url.startsWith(baseUrl))
        return;
    const key = url.slice(baseUrl.length).replace(/^\/+/, '');
    if (!key)
        return;
    yield s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: (0, s3_1.S3_BUCKET)(), Key: key }));
});
exports.deleteAsset = deleteAsset;
//# sourceMappingURL=file.upload.js.map