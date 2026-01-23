"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_promise_1 = __importDefault(require("pg-promise"));
const bluebird_1 = __importDefault(require("bluebird"));
const env_1 = __importDefault(require("../shared/utils/env"));
const pg = (0, pg_promise_1.default)({ promiseLib: bluebird_1.default, noWarnings: true });
const db = pg(env_1.default.get('DATABASE_URL'));
exports.db = db;
//# sourceMappingURL=database.js.map