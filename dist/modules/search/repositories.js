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
exports.SearchRepositoryImpl = void 0;
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
const query_2 = __importDefault(require("../posts/query"));
class SearchRepositoryImpl {
    search(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _d;
            try {
                const page = parseInt((_a = dto.page) !== null && _a !== void 0 ? _a : '1', 10);
                const limit = Math.min(parseInt((_b = dto.limit) !== null && _b !== void 0 ? _b : '20', 10), 100);
                const offset = (page - 1) * limit;
                const q = dto.q.trim();
                const [postRows, profileRows, hashtagRows] = yield Promise.all([
                    database_1.db.manyOrNone(query_1.default.searchPosts, [offset, limit, q]),
                    database_1.db.manyOrNone(query_1.default.searchProfiles, [offset, limit, q]),
                    database_1.db.manyOrNone(query_1.default.searchHashtags, [q]),
                ]);
                const postCount = postRows.length > 0 ? parseInt(postRows[0].count, 10) : 0;
                const profileCount = profileRows.length > 0 ? parseInt(profileRows[0].count, 10) : 0;
                const userId = (_d = dto.user_id) !== null && _d !== void 0 ? _d : '';
                const posts = yield Promise.all(postRows.map((_a) => __awaiter(this, void 0, void 0, function* () {
                    var { count: _c, rank: _r } = _a, row = __rest(_a, ["count", "rank"]);
                    return (Object.assign(Object.assign({}, row), { content_segments: yield (0, helpers_1.parseContentSegments)(row.content) }));
                })));
                const profiles = yield Promise.all(profileRows.map((_a) => __awaiter(this, void 0, void 0, function* () {
                    var { count: _c, rank: _r } = _a, row = __rest(_a, ["count", "rank"]);
                    const isFollowing = yield database_1.db.one(query_2.default.isFollowingUser, [userId, row.id]);
                    return Object.assign(Object.assign({}, row), { is_following: isFollowing.exists });
                })));
                return {
                    query: q,
                    page: String(page),
                    limit: String(limit),
                    posts: {
                        results: posts,
                        total: postCount,
                        totalPages: (0, helpers_1.calcPages)(postCount, String(limit)),
                    },
                    profiles: {
                        results: profiles,
                        total: profileCount,
                        totalPages: (0, helpers_1.calcPages)(profileCount, String(limit)),
                    },
                    hashtags: hashtagRows,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.SearchRepositoryImpl = SearchRepositoryImpl;
const SearchRepository = new SearchRepositoryImpl();
exports.default = SearchRepository;
//# sourceMappingURL=repositories.js.map