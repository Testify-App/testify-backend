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
exports.CommunitiesRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
function mapToEntity(row) {
    return new entities.CommunityWithOwnerEntity(Object.assign(Object.assign({}, row), { rules: row.rules || [], owner: {
            id: row.owner_id,
            username: row.owner_username,
            avatar: row.owner_avatar,
            display_name: row.owner_display_name,
        } }));
}
class CommunitiesRepositoryImpl {
    createCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.one(query_1.default.createCommunity, [
                    payload.user_id,
                    payload.name,
                    payload.description || null,
                    payload.category || null,
                    payload.avatar || null,
                    payload.cover_image || null,
                    payload.visibility || 'public',
                    JSON.stringify(payload.rules || []),
                ]);
                const full = yield database_1.db.one(query_1.default.getCommunityById, [community.id]);
                return mapToEntity(full);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone(query_1.default.getCommunityById, [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                const memberRow = yield database_1.db.oneOrNone(query_1.default.getMemberStatus, [
                    payload.community_id,
                    payload.user_id,
                ]);
                return mapToEntity(Object.assign(Object.assign({}, community), { member_status: (memberRow === null || memberRow === void 0 ? void 0 : memberRow.status) || null }));
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    getMyCommunities(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getMyCommunities,
                    params: [user_id],
                });
                const communities = rows.map((row) => mapToEntity(row));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    communities,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getJoinedCommunities(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getJoinedCommunities,
                    params: [user_id],
                });
                const communities = rows.map((row) => mapToEntity(row));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    communities,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    updateCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updated = yield database_1.db.oneOrNone(query_1.default.updateCommunity, [
                    payload.community_id,
                    payload.name || null,
                    payload.description !== undefined ? payload.description : null,
                    payload.category !== undefined ? payload.category : null,
                    payload.avatar !== undefined ? payload.avatar : null,
                    payload.cover_image !== undefined ? payload.cover_image : null,
                    payload.visibility || null,
                    payload.rules !== undefined ? JSON.stringify(payload.rules) : null,
                    payload.user_id,
                ]);
                if (!updated)
                    return new errors_1.NotFoundException('Community not found or you are not the owner');
                const full = yield database_1.db.one(query_1.default.getCommunityById, [updated.id]);
                return mapToEntity(full);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    deleteCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const exists = yield database_1.db.oneOrNone('SELECT id FROM communities WHERE id = $1 AND owner_id = $2', [payload.community_id, payload.user_id]);
                if (!exists)
                    return new errors_1.NotFoundException('Community not found or you are not the owner');
                yield database_1.db.none(query_1.default.deleteCommunity, [payload.community_id, payload.user_id]);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    joinCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id, visibility FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id === payload.user_id) {
                    return new errors_1.BadException('You are the owner of this community');
                }
                const existing = yield database_1.db.oneOrNone(query_1.default.getMemberStatus, [
                    payload.community_id,
                    payload.user_id,
                ]);
                if (existing) {
                    if (existing.status === 'accepted')
                        return new errors_1.BadException('You are already a member');
                    if (existing.status === 'pending')
                        return new errors_1.BadException('Your request is already pending');
                }
                const memberStatus = community.visibility === 'private' ? 'pending' : 'accepted';
                yield database_1.db.oneOrNone(query_1.default.joinCommunity, [
                    payload.community_id,
                    payload.user_id,
                    memberStatus,
                ]);
                if (memberStatus === 'accepted') {
                    yield database_1.db.none(query_1.default.incrementMembersCount, [payload.community_id]);
                }
                return { status: memberStatus };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    leaveCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id === payload.user_id) {
                    return new errors_1.BadException('Owner cannot leave their own community');
                }
                const member = yield database_1.db.oneOrNone(query_1.default.getMemberStatus, [
                    payload.community_id,
                    payload.user_id,
                ]);
                if (!member)
                    return new errors_1.NotFoundException('You are not a member of this community');
                yield database_1.db.oneOrNone(query_1.default.leaveCommunity, [payload.community_id, payload.user_id]);
                if (member.status === 'accepted') {
                    yield database_1.db.none(query_1.default.decrementMembersCount, [payload.community_id]);
                }
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getCommunityMembers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id FROM communities WHERE id = $1', [
                    payload.community_id,
                ]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                const { page = '1', limit = '20', community_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getCommunityMembers,
                    params: [community_id],
                });
                const members = rows.map((row) => new entities.CommunityMemberEntity(row));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    members,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getPendingRequests(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can view join requests');
                }
                const { page = '1', limit = '20', community_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getPendingRequests,
                    params: [community_id],
                });
                const requests = rows.map((row) => new entities.CommunityMemberEntity(row));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    requests,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    acceptJoinRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can accept join requests');
                }
                const updated = yield database_1.db.oneOrNone(query_1.default.acceptJoinRequest, [
                    payload.community_id,
                    payload.target_user_id,
                ]);
                if (!updated)
                    return new errors_1.NotFoundException('No pending request found for this user');
                yield database_1.db.none(query_1.default.incrementMembersCount, [payload.community_id]);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    declineJoinRequest(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can decline join requests');
                }
                const deleted = yield database_1.db.oneOrNone(query_1.default.declineJoinRequest, [
                    payload.community_id,
                    payload.target_user_id,
                ]);
                if (!deleted)
                    return new errors_1.NotFoundException('No pending request found for this user');
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    removeMember(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can remove members');
                }
                if (payload.target_user_id === payload.user_id) {
                    return new errors_1.BadException('Owner cannot remove themselves');
                }
                const removed = yield database_1.db.oneOrNone(query_1.default.removeMember, [
                    payload.community_id,
                    payload.target_user_id,
                ]);
                if (!removed)
                    return new errors_1.NotFoundException('User is not a member of this community');
                if (removed.status === 'accepted') {
                    yield database_1.db.none(query_1.default.decrementMembersCount, [payload.community_id]);
                }
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    banMember(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can ban members');
                }
                if (payload.target_user_id === payload.user_id) {
                    return new errors_1.BadException('Owner cannot ban themselves');
                }
                yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const member = yield t.oneOrNone(query_1.default.removeMember, [
                        payload.community_id,
                        payload.target_user_id,
                    ]);
                    yield t.oneOrNone(query_1.default.banMember, [
                        payload.community_id,
                        payload.target_user_id,
                        payload.user_id,
                        payload.reason || null,
                    ]);
                    if ((member === null || member === void 0 ? void 0 : member.status) === 'accepted') {
                        yield t.none(query_1.default.decrementMembersCount, [payload.community_id]);
                    }
                }));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    removeTestimony(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can remove testimonies');
                }
                const removed = yield database_1.db.oneOrNone(query_1.default.removeTestimony, [
                    payload.testimony_id,
                    payload.user_id,
                    payload.community_id,
                ]);
                if (!removed)
                    return new errors_1.NotFoundException('Testimony not found in this community');
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    pinTestimony(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can pin testimonies');
                }
                const post = yield database_1.db.oneOrNone('SELECT id, is_pinned FROM community_posts WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL', [payload.testimony_id, payload.community_id]);
                if (!post)
                    return new errors_1.NotFoundException('Testimony not found in this community');
                yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    yield t.none(query_1.default.unpinAllTestimonies, [payload.community_id]);
                    if (!post.is_pinned) {
                        yield t.oneOrNone(query_1.default.pinTestimony, [payload.testimony_id, payload.community_id]);
                    }
                }));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    reportCommunity(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                yield database_1.db.oneOrNone(query_1.default.reportCommunity, [
                    payload.community_id,
                    payload.user_id,
                    payload.reason || null,
                ]);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    reportTestimony(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                const post = yield database_1.db.oneOrNone('SELECT id FROM community_posts WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL', [payload.testimony_id, payload.community_id]);
                if (!post)
                    return new errors_1.NotFoundException('Testimony not found in this community');
                yield database_1.db.oneOrNone(query_1.default.reportTestimony, [
                    payload.community_id,
                    payload.user_id,
                    payload.testimony_id,
                    payload.reason || null,
                ]);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getReportedContent(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can review reported content');
                }
                const { page = '1', limit = '20', community_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getReportedContent,
                    params: [community_id],
                });
                const reports = rows.map((row) => new entities.CommunityReportEntity(Object.assign(Object.assign({}, row), { reporter: { username: row.reporter_username, avatar: row.reporter_avatar } })));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    reports,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    reviewReport(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                if (community.owner_id !== payload.user_id) {
                    return new errors_1.BadException('Only the community owner can review reports');
                }
                const updated = yield database_1.db.oneOrNone(query_1.default.updateReportStatus, [
                    payload.report_id,
                    payload.community_id,
                    payload.status,
                    payload.user_id,
                ]);
                if (!updated)
                    return new errors_1.NotFoundException('Report not found');
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    createCommunityPost(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id, owner_id FROM communities WHERE id = $1', [payload.community_id]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                const isBanned = yield database_1.db.oneOrNone(query_1.default.isBanned, [
                    payload.community_id,
                    payload.user_id,
                ]);
                if (isBanned === null || isBanned === void 0 ? void 0 : isBanned.exists)
                    return new errors_1.BadException('You are banned from this community');
                const isOwner = community.owner_id === payload.user_id;
                if (!isOwner) {
                    const membership = yield database_1.db.oneOrNone(query_1.default.getMemberStatus, [
                        payload.community_id,
                        payload.user_id,
                    ]);
                    if (!membership || membership.status !== 'accepted') {
                        return new errors_1.BadException('You must be an accepted member to post in this community');
                    }
                }
                let postType = 'text';
                if (payload.media_attachments && payload.media_attachments.length > 0) {
                    const types = new Set(payload.media_attachments.map((m) => m.type));
                    postType = types.size === 1 ? types.values().next().value : 'mixed';
                }
                const post = yield database_1.db.one(query_1.default.createCommunityPost, [
                    payload.community_id,
                    payload.user_id,
                    payload.content || null,
                    postType,
                    JSON.stringify(payload.media_attachments || []),
                ]);
                const content_segments = payload.content
                    ? yield (0, helpers_1.parseContentSegments)(payload.content)
                    : [];
                return new entities.CommunityTestimonyEntity(Object.assign(Object.assign({}, post), { content_segments, is_liked: false, author: { id: payload.user_id }, community: { id: payload.community_id } }));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getCommunityTestimonies(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const community = yield database_1.db.oneOrNone('SELECT id FROM communities WHERE id = $1', [
                    payload.community_id,
                ]);
                if (!community)
                    return new errors_1.NotFoundException('Community not found');
                const { page = '1', limit = '20', community_id, user_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getCommunityTestimonies,
                    params: [community_id, user_id],
                });
                const testimonies = rows.map((row) => new entities.CommunityTestimonyEntity(Object.assign(Object.assign({}, row), { author: {
                        id: row.user_id,
                        username: row.author_username,
                        avatar: row.author_avatar,
                        display_name: row.author_display_name,
                    }, community: {
                        id: row.community_id,
                        name: row.community_name,
                        avatar: row.community_avatar,
                    } })));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    testimonies,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getUserCommunityTestimonies(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', target_user_id, requesting_user_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getUserCommunityTestimonies,
                    params: [target_user_id, requesting_user_id],
                });
                const testimonies = rows.map((row) => new entities.CommunityTestimonyEntity(Object.assign(Object.assign({}, row), { author: {
                        id: row.user_id,
                        username: row.author_username,
                        avatar: row.author_avatar,
                        display_name: row.author_display_name,
                    }, community: {
                        id: row.community_id,
                        name: row.community_name,
                        avatar: row.community_avatar,
                    } })));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    testimonies,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.CommunitiesRepositoryImpl = CommunitiesRepositoryImpl;
const CommunitiesRepository = new CommunitiesRepositoryImpl();
exports.default = CommunitiesRepository;
//# sourceMappingURL=repositories.js.map