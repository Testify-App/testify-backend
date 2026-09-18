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
exports.startStoryCleanupJob = exports.runStoryCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../../config/database");
const logger_1 = __importDefault(require("../services/logger"));
const query_1 = __importDefault(require("../../modules/stories/query"));
const file_upload_1 = require("../integrations/file.upload");
const runStoryCleanup = () => __awaiter(void 0, void 0, void 0, function* () {
    const expired = yield database_1.db.manyOrNone(query_1.default.deleteExpiredStories);
    yield Promise.all(expired
        .filter((row) => row.media_url || row.thumbnail_url)
        .map((row) => (0, file_upload_1.deleteAsset)(row.media_url || row.thumbnail_url).catch(() => { })));
    if (expired.length > 0) {
        logger_1.default.info(`Cleaned up ${expired.length} expired stor${expired.length === 1 ? 'y' : 'ies'}`, 'story-cleanup.job.ts');
    }
});
exports.runStoryCleanup = runStoryCleanup;
const startStoryCleanupJob = () => {
    node_cron_1.default.schedule('0 3 * * *', () => {
        (0, exports.runStoryCleanup)().catch((error) => logger_1.default.error(`Story cleanup failed: ${error.message}`, 'story-cleanup.job.ts'));
    });
};
exports.startStoryCleanupJob = startStoryCleanupJob;
//# sourceMappingURL=story-cleanup.job.js.map