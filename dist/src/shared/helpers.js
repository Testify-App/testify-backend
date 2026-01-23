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
exports.setLastLoginTime = exports.FetchPaginatedResponse = exports.calcPages = exports.fetchResourceByPage = void 0;
const database_1 = require("../config/database");
const base_entity_1 = require("./utils/base-entity");
const query_1 = __importDefault(require("../modules/authentication/query"));
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