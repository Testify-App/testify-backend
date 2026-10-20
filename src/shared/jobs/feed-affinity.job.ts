import cron from 'node-cron';
import { db } from '../../config/database';
import logger from '../services/logger';
import PostsQuery from '../../modules/posts/query';
import {
  AFFINITY_WINDOW_DAYS,
  AFFINITY_DECAY_HALF_LIFE_DAYS,
  AFFINITY_DWELL_THRESHOLD_MS,
  AFFINITY_EVENT_WEIGHTS,
} from '../../modules/posts/feed-ranking.constants';

export const runFeedAffinityRefresh = async (): Promise<void> => {
  const windowStart = new Date(Date.now() - AFFINITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const eventParams = [
    windowStart,
    AFFINITY_DECAY_HALF_LIFE_DAYS,
    AFFINITY_EVENT_WEIGHTS.LIKE,
    AFFINITY_EVENT_WEIGHTS.COMMENT,
    AFFINITY_EVENT_WEIGHTS.REPOST,
    AFFINITY_EVENT_WEIGHTS.BOOKMARK,
    AFFINITY_EVENT_WEIGHTS.DWELL,
    AFFINITY_EVENT_WEIGHTS.SKIP,
    AFFINITY_DWELL_THRESHOLD_MS,
  ];

  const counts = await db.tx(async (t) => {
    const topics = await t.result(PostsQuery.refreshUserTopicAffinity, eventParams);
    const creators = await t.result(PostsQuery.refreshUserCreatorAffinity, eventParams);
    // Rows not touched by this run have fully decayed out of the trailing window — drop them
    // rather than leave a stale score that no longer reflects any recent behavior.
    const prunedTopics = await t.result(PostsQuery.pruneStaleTopicAffinity, [windowStart]);
    const prunedCreators = await t.result(PostsQuery.pruneStaleCreatorAffinity, [windowStart]);
    return {
      topics: topics.rowCount,
      creators: creators.rowCount,
      pruned: prunedTopics.rowCount + prunedCreators.rowCount,
    };
  });

  logger.info(
    `Refreshed feed affinity: ${counts.topics} topic rows, ${counts.creators} creator rows, ${counts.pruned} stale rows pruned`,
    'feed-affinity.job.ts'
  );
};

export const startFeedAffinityJob = (): void => {
  cron.schedule('0 2 * * *', () => {
    runFeedAffinityRefresh().catch((error) =>
      logger.error(`Feed affinity refresh failed: ${error.message}`, 'feed-affinity.job.ts')
    );
  });
};
