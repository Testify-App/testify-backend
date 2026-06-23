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
exports.HashtagsController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const logger_1 = __importDefault(require("../../shared/services/logger"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class HashtagsController {
    constructor() {
        this.getHashtag = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const tag = req.params.tag;
            const response = yield services_1.default.getHashtag(tag);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'hashtags.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Hashtag retrieved successfully', 'hashtags.controller.ts');
            return ResponseBuilder.success(res, 'Hashtag retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getPostsByHashtag = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const dto = new dtos.GetHashtagFeedDTO(req.query);
            dto.tag = req.params.tag;
            dto.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getPostsByHashtag(dto);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'hashtags.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Hashtag feed retrieved successfully', 'hashtags.controller.ts');
            return ResponseBuilder.success(res, 'Hashtag feed retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getTrendingHashtags = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.TrendingHashtagsDTO(req.query);
            const response = yield services_1.default.getTrendingHashtags(dto);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'hashtags.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Trending hashtags retrieved successfully', 'hashtags.controller.ts');
            return ResponseBuilder.success(res, 'Trending hashtags retrieved successfully', http_status_codes_1.StatusCodes.OK, { hashtags: response });
        });
        this.searchHashtags = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.SearchHashtagDTO(req.query);
            const response = yield services_1.default.searchHashtags(dto);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(`${response.message}`, 'hashtags.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('Hashtag search completed', 'hashtags.controller.ts');
            return ResponseBuilder.success(res, 'Hashtags retrieved successfully', http_status_codes_1.StatusCodes.OK, { hashtags: response });
        });
    }
}
exports.HashtagsController = HashtagsController;
const hashtagsController = new HashtagsController();
exports.default = hashtagsController;
//# sourceMappingURL=controller.js.map