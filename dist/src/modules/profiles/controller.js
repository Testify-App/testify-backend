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
exports.ProfilesController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const logger_1 = __importDefault(require("../../shared/services/logger"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class ProfilesController {
    constructor() {
        this.getProfile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.GetProfileDTO();
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getProfile(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Profile retrieved successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Profile retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.updateProfile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.UpdateProfileDTO(req.body);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.updateProfile(payload);
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('Profile updated successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Profile updated successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.addToTribe = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.AddToTribeDTO(req.body);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.addToTribe(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            logger_1.default.info('User added to Tribe successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Added to Tribe successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.removeFromTribe = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.RemoveFromTribeDTO(req.params);
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            console.log('removeFromTribe payload -> ', payload);
            const response = yield services_1.default.removeFromTribe(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('User removed from Tribe successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Removed from Tribe successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getTribeMembers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const query = new dtos.GetTribeMembersQueryDTO(req.query);
            query.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getTribeMembers(query);
            if (response instanceof errors_1.InternalServerErrorException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
            }
            logger_1.default.info('Tribe members retrieved successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Tribe members retrieved', http_status_codes_1.StatusCodes.OK, response);
        });
        this.searchProfilesByUsername = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const query = new dtos.SearchProfilesByUsernameQueryDTO(req.query);
            query.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.searchProfilesByUsername(query);
            if (response instanceof errors_1.InternalServerErrorException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
            }
            logger_1.default.info('Profiles searched successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Profiles found', http_status_codes_1.StatusCodes.OK, response);
        });
        this.isInTribe = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const followingId = req.params.userId;
            const response = yield services_1.default.isInTribe(userId, followingId);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            return ResponseBuilder.success(res, 'Tribe membership checked', http_status_codes_1.StatusCodes.OK, { is_in_tribe: response });
        });
        this.sendCircleRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.SendCircleRequestDTO();
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            payload.connected_user_id = req.body.connected_user_id;
            const response = yield services_1.default.sendCircleRequest(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            if (response instanceof errors_1.ConflictException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.CONFLICT);
            }
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Circle request sent successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Circle request sent', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.acceptCircleRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.AcceptCircleRequestDTO();
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            payload.request_id = req.params.requestId;
            const response = yield services_1.default.acceptCircleRequest(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            if (response instanceof errors_1.NotFoundException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            logger_1.default.info('Circle request accepted successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Circle request accepted', http_status_codes_1.StatusCodes.OK, response);
        });
        this.rejectCircleRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.RejectCircleRequestDTO();
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            payload.request_id = req.params.requestId;
            const response = yield services_1.default.rejectCircleRequest(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('Circle request rejected', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Circle request rejected', http_status_codes_1.StatusCodes.OK, response);
        });
        this.removeFromCircle = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.RemoveFromCircleDTO();
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            payload.connected_user_id = req.params.userId;
            const response = yield services_1.default.removeFromCircle(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('User removed from Circle successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Removed from Circle successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getCircleMembers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payload = new dtos.GetCircleMembersDTO();
            payload.user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            payload.limit = parseInt(req.query.limit) || 20;
            payload.offset = parseInt(req.query.offset) || 0;
            const response = yield services_1.default.getCircleMembers(payload);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('Circle members retrieved successfully', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Circle members retrieved', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getCircleCount = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getCircleCount(userId);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            return ResponseBuilder.success(res, 'Circle count retrieved', http_status_codes_1.StatusCodes.OK, { count: response });
        });
        this.isInCircle = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const connectedUserId = req.params.userId;
            const response = yield services_1.default.isInCircle(userId, connectedUserId);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            return ResponseBuilder.success(res, 'Circle membership checked', http_status_codes_1.StatusCodes.OK, { is_in_circle: response });
        });
        this.getPendingRequests = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getPendingRequests(userId);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('Pending Circle requests retrieved', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Pending requests retrieved', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getSentRequests = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
            const response = yield services_1.default.getSentRequests(userId);
            if (response instanceof errors_1.BadException) {
                logger_1.default.error(response.message, 'profiles.controller.ts');
                return ResponseBuilder.error(res, response, response.code);
            }
            logger_1.default.info('Sent Circle requests retrieved', 'profiles.controller.ts');
            return ResponseBuilder.success(res, 'Sent requests retrieved', http_status_codes_1.StatusCodes.OK, response);
        });
    }
}
exports.ProfilesController = ProfilesController;
const profilesController = new ProfilesController();
exports.default = profilesController;
//# sourceMappingURL=controller.js.map