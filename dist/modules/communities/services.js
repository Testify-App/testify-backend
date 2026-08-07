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
exports.CommunitiesServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
class CommunitiesServiceImpl {
    createCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.createCommunity(payload);
        });
    }
    getCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getCommunity(payload);
        });
    }
    getMyCommunities(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getMyCommunities(payload);
        });
    }
    getJoinedCommunities(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getJoinedCommunities(payload);
        });
    }
    updateCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.updateCommunity(payload);
        });
    }
    deleteCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.deleteCommunity(payload);
        });
    }
    joinCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.joinCommunity(payload);
        });
    }
    leaveCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.leaveCommunity(payload);
        });
    }
    getCommunityMembers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getCommunityMembers(payload);
        });
    }
    getPendingRequests(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getPendingRequests(payload);
        });
    }
    acceptJoinRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.acceptJoinRequest(payload);
        });
    }
    declineJoinRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.declineJoinRequest(payload);
        });
    }
    removeMember(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.removeMember(payload);
        });
    }
    banMember(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.banMember(payload);
        });
    }
    removeTestimony(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.removeTestimony(payload);
        });
    }
    pinTestimony(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.pinTestimony(payload);
        });
    }
    reportCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.reportCommunity(payload);
        });
    }
    reportTestimony(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.reportTestimony(payload);
        });
    }
    getReportedContent(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getReportedContent(payload);
        });
    }
    reviewReport(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.reviewReport(payload);
        });
    }
    createCommunityPost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.createCommunityPost(payload);
        });
    }
    getCommunityTestimonies(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getCommunityTestimonies(payload);
        });
    }
    getUserCommunityTestimonies(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            return repositories_1.default.getUserCommunityTestimonies(payload);
        });
    }
}
exports.CommunitiesServiceImpl = CommunitiesServiceImpl;
const CommunitiesService = new CommunitiesServiceImpl();
exports.default = CommunitiesService;
//# sourceMappingURL=services.js.map