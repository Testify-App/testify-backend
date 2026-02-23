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
exports.cloudinaryUpload = cloudinaryUpload;
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = require("cloudinary");
const env_1 = __importDefault(require("../utils/env"));
function cloudinaryUpload(publicId, fileBuffer, mimetype) {
    return new Promise((resolve, reject) => {
        console.log('mimetype -> ', mimetype);
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            public_id: publicId,
            resource_type: 'auto',
            folder: 'testify',
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result);
            }
        });
        uploadStream.end(fileBuffer);
    });
}
const UploadFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let publicId = crypto_1.default.randomUUID();
        const buffer = Buffer.from(file.buffer);
        const fileName = ((_a = file.originalname) === null || _a === void 0 ? void 0 : _a.split('.')[0]) || 'file';
        publicId = `testify/${publicId}-${fileName}`;
        if (env_1.default.get('NODE_ENV') === 'test') {
            return 'https://www.google.com/photos/about/';
        }
        const result = yield cloudinaryUpload(publicId, buffer, file.mimetype);
        return result.secure_url;
    }
    catch (error) {
        throw new Error(`Error uploading file. ${error}`);
    }
});
exports.UploadFile = UploadFile;
//# sourceMappingURL=file.upload.js.map