// Single place to tune Home feed ranking. Weights/ratios/thresholds here are
// starting values mirroring getFollowingFeed's existing engagement proportions —
// not final. Tune these once Phase 1's impression data has real volume; that is
// a config change, not a rewrite of the ranking/aggregation logic around them.

// Mirrors getFollowingFeed's existing score so both feeds weigh engagement the same way.
export const ENGAGEMENT_WEIGHTS = {
  LIKE: 3,
  REPOST: 2,
  COMMENT: 1,
} as const;

export const RELEVANCE_WEIGHTS = {
  TOPIC_AFFINITY: 10,
  CREATOR_AFFINITY: 15,
  COMMUNITY_MEMBER_BONUS: 8,
  // Score points lost per hour since the post was created (same shape as getFollowingFeed).
  RECENCY_DECAY_PER_HOUR: 0.5,
} as const;

// A post counts as "personalized" when the viewer's combined topic + creator
// affinity reaches this value, or when it comes from a followed author.
export const PERSONALIZED_AFFINITY_THRESHOLD = 1;

// Scores are rounded so mathematically equal scores tie exactly and fall through
// to the deterministic created_at/id tie-break; otherwise float noise reorders
// results between identical-looking requests.
export const RELEVANCE_SCORE_PRECISION = 4;

export const TRENDING_WINDOW_HOURS = 6;
// Floor on post age when computing engagement velocity, so a 1-minute-old post
// with one like doesn't dominate a "highest velocity" ranking.
export const VELOCITY_MIN_AGE_HOURS = 0.5;

// Each request ranks a window of (page size * multiplier) candidates, then serves one page from it.
export const CANDIDATE_POOL_MULTIPLIER = 3;

// Product decision: personalized : discovery : trending : reposted mix per page,
// so the feed never collapses into an echo chamber even when personalization
// scores are confident. "reposted" surfaces posts someone the viewer follows
// has reposted — real "Reposted by X" attribution, same mechanism the
// now-unused Following feed had, wired into the actual feed users see.
export const FEED_INTERLEAVE_RATIO = {
  personalized: 6,
  discovery: 2,
  trending: 1,
  reposted: 1,
} as const;

// Product decision: never show 3+ consecutive posts from the same author, community, or dominant hashtag.
export const MAX_CONSECUTIVE_SAME_SOURCE = 2;

// Users with fewer lifetime interactions (likes + comments + reposts + bookmarks) get the cold-start feed.
export const COLD_START_INTERACTION_THRESHOLD = 15;
export const COLD_START_TRENDING_WINDOW_HOURS = 48;
export const COLD_START_MAX_PER_AUTHOR = 2;

// Nightly affinity aggregation (src/shared/jobs/feed-affinity.job.ts).
export const AFFINITY_WINDOW_DAYS = 30;
export const AFFINITY_DECAY_HALF_LIFE_DAYS = 7;
export const AFFINITY_DWELL_THRESHOLD_MS = 3000;
export const AFFINITY_EVENT_WEIGHTS = {
  LIKE: 1,
  COMMENT: 2,
  REPOST: 3,
  BOOKMARK: 2,
  DWELL: 1,
  SKIP: -0.5,
} as const;
