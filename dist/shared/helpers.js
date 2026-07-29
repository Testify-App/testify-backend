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
exports.setLastLoginTime = exports.FetchPaginatedResponse = exports.calcPages = exports.fetchResourceByPage = exports.parseContentSegments = void 0;
const database_1 = require("../config/database");
const base_entity_1 = require("./utils/base-entity");
const query_1 = __importDefault(require("../modules/authentication/query"));
const parseContentSegments = (content) => __awaiter(void 0, void 0, void 0, function* () {
    if (!content)
        return [];
    const tokenRegex = /(@[a-zA-Z0-9_]+|#[a-zA-Z0-9]+)/g;
    const parts = content.split(tokenRegex);
    const mentionUsernames = parts
        .filter(p => p.startsWith('@'))
        .map(p => p.substring(1));
    const userMap = new Map();
    if (mentionUsernames.length > 0) {
        const users = yield database_1.db.manyOrNone('SELECT id, username FROM users WHERE username = ANY($1::text[])', [mentionUsernames]);
        for (const u of users) {
            userMap.set(u.username.toLowerCase(), u.id);
        }
    }
    const segments = [];
    for (const part of parts) {
        if (!part)
            continue;
        if (part.startsWith('@')) {
            const username = part.substring(1);
            segments.push({ type: 'mention', value: part, user_id: userMap.get(username.toLowerCase()) });
        }
        else if (part.startsWith('#')) {
            segments.push({ type: 'hashtag', value: part });
        }
        else if (part.trim()) {
            segments.push({ type: 'text', value: part });
        }
    }
    return segments;
});
exports.parseContentSegments = parseContentSegments;
const fetchResourceByPage = (_a) => __awaiter(void 0, [_a], void 0, function* ({ page, limit, getResources, params = [], }) {
    const offSet = limit === 'none' ? 0 : (+page - 1) * +limit;
    const max = limit === 'none' ? null : +limit;
    const results = yield database_1.db.any(getResources, [offSet, max, ...params]);
    const count = results.length > 0 ? parseInt(results[0].count, 10) : 0;
    return [{ count }, results];
});
exports.fetchResourceByPage = fetchResourceByPage;
const calcPages = (total, limit) => Math.ceil(total / +limit);
exports.calcPages = calcPages;
class FetchPaginatedResponse extends base_entity_1.BaseEntity {
}
exports.FetchPaginatedResponse = FetchPaginatedResponse;
const setLastLoginTime = (payload, operation, t) => __awaiter(void 0, void 0, void 0, function* () {
    operation === 'backoffice'
        ? yield t.none(query_1.default.setBackofficeLastLoginTime, [...payload])
        : yield t.none(query_1.default.setUserLastLoginTime, [...payload]);
});
exports.setLastLoginTime = setLastLoginTime;
//# sourceMappingURL=helpers.js.map