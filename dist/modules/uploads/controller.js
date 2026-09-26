"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.UploadsController = void 0;
const http_status_codes_1 = require("http-status-codes");
const logger_1 = __importDefault(require("../../shared/services/logger"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const services_1 = __importDefault(require("./services"));
class UploadsController {
    constructor() {
        this.presign = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            try {
                const result = yield services_1.default.presignUpload(userId, req.body.purpose, req.body.contentType, req.body.contentLength);
                return ResponseBuilder.success(res, 'Upload URL generated.', http_status_codes_1.StatusCodes.OK, result);
            }
            catch (err) {
                logger_1.default.error(err.message, 'uploads.controller.ts');
                return ResponseBuilder.error(res, err, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
        });
        this.confirm = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            try {
                const result = yield services_1.default.confirmUpload(userId, req.body.key);
                return ResponseBuilder.success(res, 'Upload confirmed.', http_status_codes_1.StatusCodes.OK, result);
            }
            catch (err) {
                logger_1.default.error(err.message, 'uploads.controller.ts');
                const notFound = (err === null || err === void 0 ? void 0 : err.name) === 'NotFound' || ((_b = err === null || err === void 0 ? void 0 : err.$metadata) === null || _b === void 0 ? void 0 : _b.httpStatusCode) === 404;
                return ResponseBuilder.error(res, notFound ? new Error('upload not found or expired') : err, notFound ? http_status_codes_1.StatusCodes.NOT_FOUND : http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
        });
    }
}
exports.UploadsController = UploadsController;
exports.default = new UploadsController();
//# sourceMappingURL=controller.js.map