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
exports.UploadFile = void 0;
exports.s3upload = s3upload;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = __importDefault(require("../utils/env"));
const aws_1 = __importDefault(require("../../config/aws"));
function s3upload(Key, Body, mimetype) {
    const params = {
        Bucket: `${env_1.default.get('AWS_BUCKET_NAME')}`,
        Key,
        Body,
        ACL: 'public-read',
        ContentType: mimetype,
    };
    if (env_1.default.get('NODE_ENV') === 'test') {
        return { Location: 'https://www.google.com/photos/about/' };
    }
    const upload = aws_1.default.upload(params);
    return upload.promise();
}
;
const UploadFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let key = crypto_1.default.randomUUID();
        key = `files-koins/${key}.${file.originalname}`;
        const buffer = Buffer.from(file.buffer);
        const { Location } = yield s3upload(key, buffer, file.mimetype);
        return Location;
    }
    catch (error) {
        throw new Error(`Error uploading file. ${error}`);
    }
});
exports.UploadFile = UploadFile;
//# sourceMappingURL=file.upload.js.map