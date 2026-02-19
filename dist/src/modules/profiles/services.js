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
exports.ProfilesServiceImpl = void 0;
const repositories_1 = __importDefault(require("./repositories"));
const errors_1 = require("../../shared/lib/errors");
class ProfilesServiceImpl {
    constructor() {
        this.getProfile = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getProfile(payload);
        });
        this.updateProfile = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.updateProfile(payload);
        });
        this.addToTribe = (payload) => __awaiter(this, void 0, void 0, function* () {
            if (payload.user_id === payload.following_id) {
                return new errors_1.BadException('You cannot follow yourself');
            }
            const userExists = yield repositories_1.default.checkUserExists(payload.following_id);
            if (!userExists) {
                return new errors_1.NotFoundException('User not found');
            }
            return yield repositories_1.default.addToTribe(payload);
        });
        this.removeFromTribe = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.removeFromTribe(payload);
        });
        this.getTribeMembers = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getTribeMembers(payload);
        });
        this.getTribeCount = (userId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getTribeCount(userId);
        });
        this.isInTribe = (userId, followingId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.isInTribe(userId, followingId);
        });
        this.getFollowerCount = (userId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getFollowerCount(userId);
        });
        this.checkUserExists = (userId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.checkUserExists(userId);
        });
        this.sendCircleRequest = (payload) => __awaiter(this, void 0, void 0, function* () {
            if (payload.user_id === payload.connected_user_id) {
                return new errors_1.BadException('You cannot send a Circle request to yourself');
            }
            const userExists = yield repositories_1.default.checkUserExists(payload.connected_user_id);
            if (!userExists) {
                return new errors_1.NotFoundException('User not found');
            }
            const hasPending = yield repositories_1.default.hasPendingRequest(payload.user_id, payload.connected_user_id);
            if (hasPending) {
                return new errors_1.ConflictException('A Circle request is already pending');
            }
            const isConnected = yield repositories_1.default.isInCircle(payload.user_id, payload.connected_user_id);
            if (isConnected) {
                return new errors_1.ConflictException('User is already in your Circle');
            }
            return yield repositories_1.default.sendCircleRequest(payload);
        });
        this.acceptCircleRequest = (payload) => __awaiter(this, void 0, void 0, function* () {
            const request = yield repositories_1.default.getRequestById(payload.request_id, payload.user_id);
            if (!request) {
                return new errors_1.NotFoundException('Circle request not found');
            }
            if (request.status !== 'pending') {
                return new errors_1.BadException('This request has already been processed');
            }
            return yield repositories_1.default.acceptCircleRequest(payload);
        });
        this.rejectCircleRequest = (payload) => __awaiter(this, void 0, void 0, function* () {
            const request = yield repositories_1.default.getRequestById(payload.request_id, payload.user_id);
            if (!request) {
                return new errors_1.BadException('Circle request not found');
            }
            if (request.status !== 'pending') {
                return new errors_1.BadException('This request has already been processed');
            }
            return yield repositories_1.default.rejectCircleRequest(payload);
        });
        this.removeFromCircle = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.removeFromCircle(payload);
        });
        this.getCircleMembers = (payload) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getCircleMembers(payload);
        });
        this.getCircleCount = (userId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getCircleCount(userId);
        });
        this.isInCircle = (userId, connectedUserId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.isInCircle(userId, connectedUserId);
        });
        this.getPendingRequests = (userId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getPendingRequests(userId);
        });
        this.getSentRequests = (userId) => __awaiter(this, void 0, void 0, function* () {
            return yield repositories_1.default.getSentRequests(userId);
        });
    }
}
exports.ProfilesServiceImpl = ProfilesServiceImpl;
const ProfilesService = new ProfilesServiceImpl();
exports.default = ProfilesService;
//# sourceMappingURL=services.js.map