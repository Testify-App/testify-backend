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
const CIRCLE_MEMBER_LIMIT = 12;
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
                    payload.username || null,
                    payload.bio || null,
                    payload.instagram || null,
                    payload.youtube || null,
                    payload.twitter || null,
                    payload.display_name || null,
                    payload.header_image || null,
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
                (0, helpers_1.createNotification)({
                    user_id: payload.following_id,
                    actor_id: payload.user_id,
                    type: 'follow',
                    entity_type: 'user',
                    entity_id: payload.user_id,
                    data: {},
                }).catch(() => { });
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
                    params: [user_id, payload.search || null],
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
          u.header_image,
          u.bio,
          u.display_name,
          COUNT(DISTINCT uf.follower_id) as tribe_members_count,
          COUNT(DISTINCT uf.follower_id) as followers_count,
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
    getFollowers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id, target_user_id } = payload;
                const [{ count }, followers] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getFollowers,
                    params: [target_user_id, payload.search || null, user_id],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    followers,
                };
            }
            catch (error) {
                return new errors_1.InternalServerErrorException(`${error.message}`);
            }
        });
    }
    addToCircle(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (payload.user_id === payload.connected_user_id) {
                    return new errors_1.BadException('You cannot add yourself to your Circle');
                }
                const result = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const senderCount = yield t.one(query_1.default.getCircleCount, [payload.user_id]);
                    const targetCount = yield t.one(query_1.default.getCircleCount, [payload.connected_user_id]);
                    if (parseInt((senderCount === null || senderCount === void 0 ? void 0 : senderCount.total) || '0', 10) >= CIRCLE_MEMBER_LIMIT) {
                        throw new errors_1.BadException(`Your Circle is full (max ${CIRCLE_MEMBER_LIMIT} members)`);
                    }
                    if (parseInt((targetCount === null || targetCount === void 0 ? void 0 : targetCount.total) || '0', 10) >= CIRCLE_MEMBER_LIMIT) {
                        throw new errors_1.BadException(`This user's Circle is full (max ${CIRCLE_MEMBER_LIMIT} members)`);
                    }
                    const forward = yield t.oneOrNone(query_1.default.addToCircle, [
                        payload.user_id,
                        payload.connected_user_id,
                    ]);
                    if (!forward) {
                        throw new errors_1.BadException('User is already in your Circle');
                    }
                    yield t.none(query_1.default.addToCircle, [
                        payload.connected_user_id,
                        payload.user_id,
                    ]);
                    return forward;
                }));
                (0, helpers_1.createNotification)({
                    user_id: payload.connected_user_id,
                    actor_id: payload.user_id,
                    type: 'circle_accepted',
                    entity_type: 'user',
                    entity_id: payload.user_id,
                    data: {},
                }).catch(() => { });
                return new entities.UserConnectionEntity(result);
            }
            catch (error) {
                if (error instanceof errors_1.BadException)
                    return error;
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
                (0, helpers_1.createNotification)({
                    user_id: payload.connected_user_id,
                    actor_id: payload.user_id,
                    type: 'circle_removed',
                    entity_type: 'user',
                    entity_id: payload.user_id,
                    data: {},
                }).catch(() => { });
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
                const { page = '1', limit = '20', user_id, } = payload;
                const [{ count }, circle_members] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getCircleMembers,
                    params: [user_id, payload.search || null],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    circle_members,
                };
            }
            catch (error) {
                return new errors_1.InternalServerErrorException(`${error.message}`);
            }
        });
    }
    ;
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
    blockUser(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (payload.user_id === payload.blocked_id) {
                    return new errors_1.BadException('You cannot block yourself');
                }
                yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const blocked = yield t.oneOrNone(query_1.default.blockUser, [payload.user_id, payload.blocked_id]);
                    if (!blocked) {
                        throw new errors_1.BadException('User is already blocked');
                    }
                    yield t.none(query_1.default.removeFromTribe, [payload.user_id, payload.blocked_id]);
                    yield t.none(query_1.default.removeFromTribe, [payload.blocked_id, payload.user_id]);
                    yield t.none(query_1.default.removeFromCircle, [payload.user_id, payload.blocked_id]);
                }));
                return;
            }
            catch (error) {
                if (error instanceof errors_1.BadException)
                    return error;
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    unblockUser(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.unblockUser, [payload.user_id, payload.blocked_id]);
                if (!result) {
                    return new errors_1.BadException('User is not blocked');
                }
                return;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getBlockedUsers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id } = query;
                const [{ count }, blocked_users] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getBlockedUsers,
                    params: [user_id, query.search || null],
                });
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    blocked_users,
                };
            }
            catch (error) {
                return new errors_1.InternalServerErrorException(`${error.message}`);
            }
        });
    }
    isBlocked(blockerId, blockedId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield database_1.db.oneOrNone(query_1.default.isBlocked, [blockerId, blockedId]);
                return (result === null || result === void 0 ? void 0 : result.exists) || false;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.ProfilesRepositoryImpl = ProfilesRepositoryImpl;
;
const ProfilesRepository = new ProfilesRepositoryImpl();
exports.default = ProfilesRepository;
//# sourceMappingURL=repositories.js.map