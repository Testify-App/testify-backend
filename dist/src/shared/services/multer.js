"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.fileFilter = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fileFilter = function (_req, file, callback) {
    const allFileFormats = [
        '.jpeg',
        '.png',
        '.jpg',
        '.pdf',
        '.doc',
        '.docx',
        '.csv',
        '.video/mp4',
        '.mp4',
        '.mkv',
        '.mov',
        '.avi',
        '.webm',
        '.3gp',
        '.3g2',
        '.flv',
        '.wmv',
        '.mpeg',
    ];
    const fileExtCheck = allFileFormats.includes(path_1.default.extname(file.originalname).toLowerCase());
    if (fileExtCheck) {
        callback(null, true);
    }
    else {
        callback(null, false);
    }
};
exports.fileFilter = fileFilter;
exports.upload = (0, multer_1.default)({
    fileFilter: exports.fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 1024,
    },
});
//# sourceMappingURL=multer.js.map