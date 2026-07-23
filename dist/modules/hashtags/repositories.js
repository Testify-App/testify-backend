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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashtagsRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
class HashtagsRepositoryImpl {
    constructor() {
        this.trendingCache = { data: [], expiresAt: 0 };
    }
    getHashtag(tag) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const row = yield database_1.db.oneOrNone(query_1.default.getHashtagByTag, [tag.toLowerCase()]);
                if (!row) {
                    return new errors_1.NotFoundException(`Hashtag #${tag} not found`);
                }
                return new entities.HashtagEntity(row);
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    getPostsByHashtag(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const page = parseInt((_a = dto.page) !== null && _a !== void 0 ? _a : '1', 10);
                const limit = Math.min(parseInt((_b = dto.limit) !== null && _b !== void 0 ? _b : '20', 10), 100);
                const offset = (page - 1) * limit;
                const tag = dto.tag.toLowerCase();
                const userId = (_c = dto.user_id) !== null && _c !== void 0 ? _c : null;
                const hashtag = yield database_1.db.oneOrNone(query_1.default.getHashtagByTag, [tag]);
                if (!hashtag) {
                    return new errors_1.BadException(`Hashtag #${tag} not found`);
                }
                const rows = yield database_1.db.manyOrNone(query_1.default.getPostsByHashtag, [offset, limit, tag, userId]);
                const count = rows.length > 0 ? parseInt(rows[0].count, 10) : 0;
                const posts = rows.map((r) => {
                    const { count: _count } = r, post = __rest(r, ["count"]);
                    return post;
                });
                return {
                    tag,
                    posts_count: hashtag.posts_count,
                    posts,
                    pagination: {
                        page: String(page),
                        limit: String(limit),
                        total: count,
                        totalPages: (0, helpers_1.calcPages)(count, String(limit)),
                    },
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getTrendingHashtags(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const now = Date.now();
                if (this.trendingCache.expiresAt > now && this.trendingCache.data.length > 0) {
                    return this.trendingCache.data;
                }
                const limit = Math.min(parseInt((_a = dto.limit) !== null && _a !== void 0 ? _a : '20', 10), 50);
                const rows = yield database_1.db.manyOrNone(query_1.default.getTrendingHashtags, [limit]);
                const hashtags = rows.map((r) => new entities.HashtagEntity(r));
                this.trendingCache = { data: hashtags, expiresAt: now + 5 * 60 * 1000 };
                return hashtags;
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    searchHashtags(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rows = yield database_1.db.manyOrNone(query_1.default.searchHashtagsByPrefix, [dto.q.toLowerCase()]);
                return rows.map((r) => ({ tag: r.tag, posts_count: r.posts_count }));
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.HashtagsRepositoryImpl = HashtagsRepositoryImpl;
const hashtagsRepository = new HashtagsRepositoryImpl();
exports.default = hashtagsRepository;
//# sourceMappingURL=repositories.js.map