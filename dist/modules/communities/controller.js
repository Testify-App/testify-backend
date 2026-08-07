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
exports.CommunitiesController = void 0;
const http_status_codes_1 = require("http-status-codes");
const dtos = __importStar(require("./dto"));
const services_1 = __importDefault(require("./services"));
const ResponseBuilder = __importStar(require("../../shared/lib/api-response"));
const errors_1 = require("../../shared/lib/errors");
class CommunitiesController {
    constructor() {
        this.createCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.CreateCommunityDTO(req.body);
            dto.user_id = req.user.id;
            const response = yield services_1.default.createCommunity(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Community created successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.getCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetCommunityDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
            });
            const response = yield services_1.default.getCommunity(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            return ResponseBuilder.success(res, 'Community retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getMyCommunities = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetMyCommunitiesQueryDTO(req.query);
            dto.user_id = req.user.id;
            const response = yield services_1.default.getMyCommunities(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Communities retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getJoinedCommunities = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetJoinedCommunitiesQueryDTO(req.query);
            dto.user_id = req.user.id;
            const response = yield services_1.default.getJoinedCommunities(dto);
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Joined communities retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.updateCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.UpdateCommunityDTO(req.body);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.updateCommunity(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Community updated successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.deleteCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.DeleteCommunityDTO(req.body);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.deleteCommunity(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Community deleted successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.joinCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.JoinCommunityDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
            });
            const response = yield services_1.default.joinCommunity(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            const message = response.status === 'pending'
                ? 'Join request sent'
                : 'Joined community successfully';
            return ResponseBuilder.success(res, message, http_status_codes_1.StatusCodes.OK, response);
        });
        this.leaveCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.LeaveCommunityDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
            });
            const response = yield services_1.default.leaveCommunity(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Left community successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.getCommunityMembers = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetCommunityMembersQueryDTO(req.query);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.getCommunityMembers(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Members retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getPendingRequests = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetPendingRequestsQueryDTO(req.query);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.getPendingRequests(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Join requests retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.acceptJoinRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.ManageJoinRequestDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                target_user_id: req.params.userId,
            });
            const response = yield services_1.default.acceptJoinRequest(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Join request accepted', http_status_codes_1.StatusCodes.OK, null);
        });
        this.declineJoinRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.ManageJoinRequestDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                target_user_id: req.params.userId,
            });
            const response = yield services_1.default.declineJoinRequest(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Join request declined', http_status_codes_1.StatusCodes.OK, null);
        });
        this.removeMember = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.RemoveMemberDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                target_user_id: req.params.userId,
            });
            const response = yield services_1.default.removeMember(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Member removed successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.banMember = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.BanMemberDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                target_user_id: req.params.userId,
                reason: req.body.reason,
            });
            const response = yield services_1.default.banMember(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Member banned successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.removeTestimony = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.TestimonyActionDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                testimony_id: req.params.testimonyId,
            });
            const response = yield services_1.default.removeTestimony(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Testimony removed successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.pinTestimony = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.TestimonyActionDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                testimony_id: req.params.testimonyId,
            });
            const response = yield services_1.default.pinTestimony(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Testimony pin updated successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.reportCommunity = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.ReportDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                reason: req.body.reason,
            });
            const response = yield services_1.default.reportCommunity(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Community reported successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.reportTestimony = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.ReportDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                testimony_id: req.params.testimonyId,
                reason: req.body.reason,
            });
            const response = yield services_1.default.reportTestimony(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Testimony reported successfully', http_status_codes_1.StatusCodes.OK, null);
        });
        this.getReportedContent = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetReportedContentQueryDTO(req.query);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.getReportedContent(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Reported content retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.createCommunityPost = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.CreateCommunityPostDTO(req.body);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.createCommunityPost(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Testimony posted successfully', http_status_codes_1.StatusCodes.CREATED, response);
        });
        this.getCommunityTestimonies = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetCommunityTestimoniesQueryDTO(req.query);
            dto.user_id = req.user.id;
            dto.community_id = req.params.communityId;
            const response = yield services_1.default.getCommunityTestimonies(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Testimonies retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.getUserCommunityTestimonies = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.GetUserCommunityTestimoniesQueryDTO(req.query);
            dto.requesting_user_id = req.user.id;
            dto.target_user_id = req.params.userId || req.user.id;
            const response = yield services_1.default.getUserCommunityTestimonies(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'User testimonies retrieved successfully', http_status_codes_1.StatusCodes.OK, response);
        });
        this.reviewReport = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const dto = new dtos.ReviewReportDTO({
                user_id: req.user.id,
                community_id: req.params.communityId,
                report_id: req.params.reportId,
                status: req.body.status,
            });
            const response = yield services_1.default.reviewReport(dto);
            if (response instanceof errors_1.NotFoundException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.NOT_FOUND);
            }
            if (response instanceof errors_1.BadException) {
                return ResponseBuilder.error(res, response, http_status_codes_1.StatusCodes.BAD_REQUEST);
            }
            return ResponseBuilder.success(res, 'Report updated successfully', http_status_codes_1.StatusCodes.OK, null);
        });
    }
}
exports.CommunitiesController = CommunitiesController;
const communitiesController = new CommunitiesController();
exports.default = communitiesController;
//# sourceMappingURL=controller.js.map