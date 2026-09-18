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
exports.StoriesController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class StoriesController {
    constructor() {
        this.createStory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.CreateStoryDTO(req.body);
            dto.user_id = req.user.id;
            const response = yield services_1.default.createStory(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Story posted successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.getCircleStories = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetCircleStoriesDTO({ user_id: req.user.id });
            const response = yield services_1.default.getCircleStories(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Circle stories retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getMyStories = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetMyStoriesDTO({ user_id: req.user.id });
            const response = yield services_1.default.getMyStories(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Stories retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getStory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetStoryDTO({
                user_id: req.user.id,
                story_id: req.params.storyId,
            });
            const response = yield services_1.default.getStory(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.ForbiddenException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.FORBIDDEN);
            }
            return ResponseBuilder.success(res, 'Story retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.deleteStory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.DeleteStoryDTO({
                user_id: req.user.id,
                story_id: req.params.storyId,
            });
            const response = yield services_1.default.deleteStory(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            return ResponseBuilder.success(res, 'Story deleted successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.getStoryViewers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetStoryViewersDTO(req.query);
            dto.user_id = req.user.id;
            dto.story_id = req.params.storyId;
            const response = yield services_1.default.getStoryViewers(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Story viewers retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
    }
}
exports.StoriesController = StoriesController;
const storiesController = new StoriesController();
exports.default = storiesController;
//# sourceMappingURL=controller.js.map