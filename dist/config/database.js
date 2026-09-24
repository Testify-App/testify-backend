"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_promise_1 = __importDefault(require("pg-promise"));
const bluebird_1 = __importDefault(require("bluebird"));
const env_1 = __importDefault(require("../shared/utils/env"));
const pg = (0, pg_promise_1.default)({ promiseLib: bluebird_1.default, noWarnings: true });
const POOL_MAX = Number((_a = process.env.DB_POOL_MAX) !== null && _a !== void 0 ? _a : 10);
const IDLE_TIMEOUT_MS = Number((_b = process.env.DB_IDLE_TIMEOUT_MS) !== null && _b !== void 0 ? _b : 30000);
const CONNECT_TIMEOUT_MS = Number((_c = process.env.DB_CONNECT_TIMEOUT_MS) !== null && _c !== void 0 ? _c : 10000);
const db = pg({
    connectionString: env_1.default.get('DATABASE_URL'),
    max: POOL_MAX,
    idleTimeoutMillis: IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
});
exports.db = db;
//# sourceMappingURL=database.js.map