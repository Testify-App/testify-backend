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
exports.ProfilesRepositoryImpl = void 0;
const query_1 = __importDefault(require("./query"));
const entities = __importStar(require("./entities"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
class ProfilesRepositoryImpl {
    getProfile(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield database_1.db.oneOrNone(query_1.default.getProfileByUserId, [payload.user_id]);
                if (!profile) {
                    return new errors_1.NotFoundException('Profile not found');
                }
                return new entities.ProfileEntity(profile);
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    getByUsername(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield database_1.db.oneOrNone(query_1.default.getByUsername, [payload.username]);
                if (!profile) {
                    return new errors_1.NotFoundException('Profile not found');
                }
                return new entities.ProfileEntity(profile);
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    updateProfile(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const profile = yield database_1.db.one(query_1.default.updateProfile, [
                    payload.user_id,
                    payload.first_name || null,
                    payload.last_name || null,
                    payload.country_code || null,
                    payload.phone_number || null,
                    payload.avatar || null,
                    payload.display_name || null,
                    payload.username || null,
                    payload.bio || null,
                    payload.instagram || null,
                    payload.youtube || null,
                    payload.twitter || null,
                ]);
                return new entities.ProfileEntity(profile);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    ;
    checkUserExists(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.checkUserExists, [userId]);
                return (result === null || result === void 0 ? void 0 : result.exists) || false;
            }
            catch (error) {
                return false;
            }
        });
    }
    addToTribe(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.addToTribe, [
                    payload.user_id,
                    payload.following_id,
                ]);
                if (!result) {
                    return new errors_1.BadException('User is already in your Tribe');
                }
                return new entities.UserFollowEntity(result);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    removeFromTribe(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_1.db.none(query_1.default.removeFromTribe, [
                    payload.user_id,
                    payload.following_id,
                ]);
                return;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getTribeMembers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id } = payload;
                const [{ count }, members] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getTribeMembers,
                    params: [user_id],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    members,
                };
            }
            catch (error) {
                return new errors_1.InternalServerErrorException(`${error.message}`);
            }
        });
    }
    ;
    searchProfilesByUsername(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', search } = payload;
                const searchPattern = `%${search}%`;
                const [{ count }, profiles] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.searchProfilesByUsername,
                    params: [searchPattern],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    profiles,
                };
            }
            catch (error) {
                return new errors_1.InternalServerErrorException(`${error.message}`);
            }
        });
    }
    ;
    fetchProfilePostHistoryById(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20' } = payload;
                const following_id_details = yield database_1.db.oneOrNone(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.country_code,
          u.phone_number,
          u.email,
          u.avatar,
          u.username,
          u.bio,
          COUNT(DISTINCT uf.follower_id) as tribe_members_count,
          CASE WHEN EXISTS (
            SELECT 1 FROM user_follows 
            WHERE follower_id = $2 AND following_id = u.id
          ) THEN true ELSE false END as is_following
        FROM users u
        LEFT JOIN user_follows uf ON u.id = uf.following_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [payload.following_id, payload.user_id]);
                const [{ count }, posts] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.fetchProfilePostHistoryById,
                    params: [payload.following_id],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    following_id_details,
                    posts,
                };
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    ;
    isInTribe(userId, followingId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.isInTribe, [userId, followingId]);
                return (result === null || result === void 0 ? void 0 : result.exists) || false;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getFollowerCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.getFollowerCount, [userId]);
                return parseInt((result === null || result === void 0 ? void 0 : result.total) || '0', 10);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    sendCircleRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.sendCircleRequest, [
                    payload.user_id,
                    payload.connected_user_id,
                ]);
                if (!result) {
                    return new errors_1.BadException('Circle request already exists');
                }
                return new entities.CircleRequestEntity(result);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    acceptCircleRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const updated = yield t.oneOrNone(query_1.default.acceptCircleRequest, [
                        payload.request_id,
                        payload.user_id,
                    ]);
                    if (!updated) {
                        return null;
                    }
                    const request = yield t.oneOrNone('SELECT * FROM user_connections WHERE id = $1', [payload.request_id]);
                    if (!request) {
                        return null;
                    }
                    yield t.none(query_1.default.createMutualConnection, [
                        payload.user_id,
                        request.user_id,
                    ]);
                    return updated;
                }));
                if (!result) {
                    return new errors_1.BadException('Circle request not found or already processed');
                }
                return new entities.UserConnectionEntity(result);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    rejectCircleRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.rejectCircleRequest, [
                    payload.request_id,
                    payload.user_id,
                ]);
                if (!result) {
                    return new errors_1.BadException('Circle request not found or already processed');
                }
                return;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    removeFromCircle(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_1.db.none(query_1.default.removeFromCircle, [
                    payload.user_id,
                    payload.connected_user_id,
                ]);
                return;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getCircleMembers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const members = yield database_1.db.manyOrNone(query_1.default.getCircleMembers, [
                    payload.user_id,
                    payload.limit || 20,
                    payload.offset || 0,
                ]);
                return members.map((member) => new entities.CircleMemberEntity(member));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getCircleCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.getCircleCount, [userId]);
                return parseInt((result === null || result === void 0 ? void 0 : result.total) || '0', 10);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    isInCircle(userId, connectedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.isInCircle, [userId, connectedUserId]);
                return (result === null || result === void 0 ? void 0 : result.exists) || false;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getPendingRequests(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requests = yield database_1.db.manyOrNone(query_1.default.getPendingRequests, [userId]);
                return requests.map((request) => new entities.CircleRequestEntity(request));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getSentRequests(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requests = yield database_1.db.manyOrNone(query_1.default.getSentRequests, [userId]);
                return requests.map((request) => new entities.CircleRequestEntity(request));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    hasPendingRequest(userId, connectedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.hasPendingRequest, [userId, connectedUserId]);
                return (result === null || result === void 0 ? void 0 : result.exists) || false;
            }
            catch (error) {
                return false;
            }
        });
    }
    getRequestById(requestId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.getRequestById, [requestId, userId]);
                return result ? new entities.CircleRequestEntity(result) : null;
            }
            catch (error) {
                return null;
            }
        });
    }
}
exports.ProfilesRepositoryImpl = ProfilesRepositoryImpl;
;
const ProfilesRepository = new ProfilesRepositoryImpl();
exports.default = ProfilesRepository;
//# sourceMappingURL=repositories.js.map