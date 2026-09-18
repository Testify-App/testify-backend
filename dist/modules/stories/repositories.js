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
exports.StoriesRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
function mapToEntity(row) {
    var _a, _b;
    return new entities.StoryEntity({
        id: row.id,
        user_id: row.user_id,
        content_type: row.content_type,
        media_url: row.media_url,
        thumbnail_url: row.thumbnail_url,
        text_content: row.text_content,
        background_style: row.background_style,
        duration: row.duration,
        views_count: Number((_a = row.views_count) !== null && _a !== void 0 ? _a : 0),
        is_viewed: (_b = row.is_viewed) !== null && _b !== void 0 ? _b : undefined,
        created_at: row.created_at,
        expires_at: row.expires_at,
        author: {
            id: row.user_id,
            username: row.author_username,
            avatar: row.author_avatar,
            display_name: row.author_display_name,
        },
    });
}
class StoriesRepositoryImpl {
    createStory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const created = yield database_1.db.one(query_1.default.createStory, [
                    payload.user_id,
                    payload.content_type,
                    payload.media_url || null,
                    payload.thumbnail_url || null,
                    payload.text_content || null,
                    payload.background_style ? JSON.stringify(payload.background_style) : null,
                    (_a = payload.duration) !== null && _a !== void 0 ? _a : null,
                ]);
                const full = yield database_1.db.one(query_1.default.getStoryById, [created.id]);
                const members = yield database_1.db.manyOrNone(`SELECT connected_user_id AS user_id FROM user_connections WHERE user_id = $1 AND status = 'accepted'`, [payload.user_id]);
                yield Promise.all(members.map((member) => (0, helpers_1.createNotification)({
                    user_id: member.user_id,
                    actor_id: payload.user_id,
                    type: 'story_posted',
                    entity_type: 'story',
                    entity_id: created.id,
                }).catch(() => { })));
                return mapToEntity(full);
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getCircleStories(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rows = yield database_1.db.manyOrNone(query_1.default.getCircleStories, [payload.user_id]);
                return rows.map((row) => mapToEntity(row));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getMyStories(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rows = yield database_1.db.manyOrNone(query_1.default.getMyStories, [payload.user_id]);
                return rows.map((row) => mapToEntity(row));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getStory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const story = yield database_1.db.oneOrNone(query_1.default.getStoryById, [payload.story_id]);
                if (!story)
                    return new errors_1.NotFoundException('Story not found');
                if (story.user_id !== payload.user_id) {
                    const inCircle = yield database_1.db.one(query_1.default.isOwnerOrInCircle, [payload.user_id, story.user_id]);
                    if (!inCircle.exists) {
                        return new errors_1.ForbiddenException('You are not in this user\'s Circle');
                    }
                    const recorded = yield database_1.db.oneOrNone(query_1.default.recordView, [payload.story_id, payload.user_id]);
                    if (recorded) {
                        yield database_1.db.none(query_1.default.incrementViewsCount, [payload.story_id]);
                        story.views_count = Number((_a = story.views_count) !== null && _a !== void 0 ? _a : 0) + 1;
                    }
                }
                return mapToEntity(Object.assign(Object.assign({}, story), { is_viewed: true }));
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    deleteStory(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleted = yield database_1.db.oneOrNone(query_1.default.deleteStory, [payload.story_id, payload.user_id]);
                if (!deleted)
                    return new errors_1.NotFoundException('Story not found or you are not the owner');
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    getStoryViewers(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const story = yield database_1.db.oneOrNone('SELECT id, user_id FROM stories WHERE id = $1 AND deleted_at IS NULL', [payload.story_id]);
                if (!story)
                    return new errors_1.NotFoundException('Story not found');
                if (story.user_id !== payload.user_id) {
                    return new errors_1.BadException('Only the story owner can view the viewer list');
                }
                const { page = '1', limit = '20', story_id } = payload;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getStoryViewers,
                    params: [story_id],
                });
                const viewers = rows.map((row) => new entities.StoryViewerEntity(row));
                return {
                    total: count,
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    viewers,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.StoriesRepositoryImpl = StoriesRepositoryImpl;
const StoriesRepository = new StoriesRepositoryImpl();
exports.default = StoriesRepository;
//# sourceMappingURL=repositories.js.map