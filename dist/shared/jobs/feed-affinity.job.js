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
exports.startFeedAffinityJob = exports.runFeedAffinityRefresh = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../../config/database");
const logger_1 = __importDefault(require("../services/logger"));
const query_1 = __importDefault(require("../../modules/posts/query"));
const feed_ranking_constants_1 = require("../../modules/posts/feed-ranking.constants");
const runFeedAffinityRefresh = () => __awaiter(void 0, void 0, void 0, function* () {
    const windowStart = new Date(Date.now() - feed_ranking_constants_1.AFFINITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const eventParams = [
        windowStart,
        feed_ranking_constants_1.AFFINITY_DECAY_HALF_LIFE_DAYS,
        feed_ranking_constants_1.AFFINITY_EVENT_WEIGHTS.LIKE,
        feed_ranking_constants_1.AFFINITY_EVENT_WEIGHTS.COMMENT,
        feed_ranking_constants_1.AFFINITY_EVENT_WEIGHTS.REPOST,
        feed_ranking_constants_1.AFFINITY_EVENT_WEIGHTS.BOOKMARK,
        feed_ranking_constants_1.AFFINITY_EVENT_WEIGHTS.DWELL,
        feed_ranking_constants_1.AFFINITY_EVENT_WEIGHTS.SKIP,
        feed_ranking_constants_1.AFFINITY_DWELL_THRESHOLD_MS,
    ];
    const counts = yield database_1.db.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
        const topics = yield t.result(query_1.default.refreshUserTopicAffinity, eventParams);
        const creators = yield t.result(query_1.default.refreshUserCreatorAffinity, eventParams);
        const prunedTopics = yield t.result(query_1.default.pruneStaleTopicAffinity, [windowStart]);
        const prunedCreators = yield t.result(query_1.default.pruneStaleCreatorAffinity, [windowStart]);
        return {
            topics: topics.rowCount,
            creators: creators.rowCount,
            pruned: prunedTopics.rowCount + prunedCreators.rowCount,
        };
    }));
    logger_1.default.info(`Refreshed feed affinity: ${counts.topics} topic rows, ${counts.creators} creator rows, ${counts.pruned} stale rows pruned`, 'feed-affinity.job.ts');
});
exports.runFeedAffinityRefresh = runFeedAffinityRefresh;
const startFeedAffinityJob = () => {
    node_cron_1.default.schedule('0 2 * * *', () => {
        (0, exports.runFeedAffinityRefresh)().catch((error) => logger_1.default.error(`Feed affinity refresh failed: ${error.message}`, 'feed-affinity.job.ts'));
    });
};
exports.startFeedAffinityJob = startFeedAffinityJob;
//# sourceMappingURL=feed-affinity.job.js.map