import {
  ENGAGEMENT_WEIGHTS,
  RELEVANCE_WEIGHTS,
  RELEVANCE_SCORE_PRECISION,
  TRENDING_WINDOW_HOURS,
  VELOCITY_MIN_AGE_HOURS,
  COLD_START_TRENDING_WINDOW_HOURS,
  COLD_START_MAX_PER_AUTHOR,
} from './feed-ranking.constants';

// Shared SELECT list + visibility/block filters used by every Home-feed-shaped
// query below, kept in one place so the ranked/discovery/trending/cold-start
// queries can't silently drift apart on filtering rules. Columns are named
// explicitly (not p.*) because getColdStartFeed UNIONs three branches and
// Postgres requires identical column lists across every branch of a UNION.
const FEED_POST_COLUMNS = `
  p.id,
  p.user_id,
  p.community_id,
  p.content,
  p.post_type,
  p.visibility,
  p.media_attachments,
  p.parent_post_id,
  p.quote_text,
  p.is_pinned,
  p.likes_count,
  p.comments_count,
  p.reposts_count,
  p.quotes_count,
  p.report_count,
  p.status,
  p.created_at,
  p.updated_at,
  u.username,
  u.avatar,
  u.display_name,
  c.name        AS community_name,
  c.avatar      AS community_avatar,
  (c.owner_id = $1) AS is_community_owner
`;

// Plain, unprefixed column list for re-selecting FEED_POST_COLUMNS' output from
// an already-materialized CTE (no p./u./c. alias exists there, and no $N
// placeholder re-binding is needed — is_community_owner was already computed).
const FEED_POST_COLUMNS_PLAIN = `
  id, user_id, community_id, content, post_type, visibility, media_attachments,
  parent_post_id, quote_text, is_pinned, likes_count, comments_count, reposts_count,
  quotes_count, report_count, status, created_at, updated_at,
  username, avatar, display_name, community_name, community_avatar, is_community_owner
`;

const FEED_VISIBILITY_AND_BLOCK_FILTER = `
  p.deleted_at IS NULL
  AND p.status != 'archived'
  AND p.parent_post_id IS NULL
  AND (
    (p.visibility = 'public')
    OR (p.user_id = $1)
    OR (p.visibility = 'circle_only' AND EXISTS (
      SELECT 1 FROM user_connections
      WHERE user_id = $1 AND connected_user_id = p.user_id AND status = 'accepted'
    ))
  )
  AND NOT EXISTS (
    SELECT 1 FROM user_blocks
    WHERE (blocker_id = $1 AND blocked_id = p.user_id)
       OR (blocker_id = p.user_id AND blocked_id = $1)
  )
`;

export default {
  createPost: `
    INSERT INTO posts (
      user_id,
      community_id,
      content,
      post_type,
      visibility,
      media_attachments,
      parent_post_id,
      quote_text,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published')
    RETURNING *;
  `,

  getPostById: `
    SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL;
  `,

  getPostWithEngagement: `
    SELECT
      p.*,
      u.id as user_id,
      u.username,
      u.avatar,
      c.id          AS community_id,
      c.name        AS community_name,
      c.avatar      AS community_avatar,
      (c.owner_id = $2) AS is_community_owner
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.id = $1 AND p.deleted_at IS NULL
      AND (
        (p.visibility = 'public')
        OR (p.user_id = $2)
        OR (p.visibility = 'circle_only' AND EXISTS (
          SELECT 1 FROM user_connections
          WHERE user_id = $2 AND connected_user_id = p.user_id AND status = 'accepted'
        ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $2 AND blocked_id = p.user_id)
           OR (blocker_id = p.user_id AND blocked_id = $2)
      );
  `,

  // Ranked Home feed candidate pool. $1 = user_id, $2 = pool size (candidate
  // pool, NOT a page — the repository layer interleaves/diversifies before
  // slicing to a page). No OFFSET: each request re-ranks from the top, since
  // scores shift request-to-request as engagement/affinity changes.
  getRankedFeedCandidates: `
    SELECT * FROM (
      SELECT
        ${FEED_POST_COLUMNS},
        COALESCE(ta.topic_score, 0) AS topic_affinity_score,
        COALESCE(ca.score, 0) AS creator_affinity_score,
        EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = p.user_id) AS is_followed_author,
        EXISTS(SELECT 1 FROM community_members WHERE user_id = $1 AND community_id = p.community_id AND status = 'accepted') AS is_member_community,
        ROUND((
          ${RELEVANCE_WEIGHTS.TOPIC_AFFINITY}::numeric * COALESCE(ta.topic_score, 0)
          + ${RELEVANCE_WEIGHTS.CREATOR_AFFINITY}::numeric * COALESCE(ca.score, 0)
          + (${ENGAGEMENT_WEIGHTS.LIKE} * p.likes_count + ${ENGAGEMENT_WEIGHTS.REPOST} * p.reposts_count + ${ENGAGEMENT_WEIGHTS.COMMENT} * p.comments_count)
          + CASE WHEN EXISTS(SELECT 1 FROM community_members WHERE user_id = $1 AND community_id = p.community_id AND status = 'accepted')
                 THEN ${RELEVANCE_WEIGHTS.COMMUNITY_MEMBER_BONUS} ELSE 0 END
          - ${RELEVANCE_WEIGHTS.RECENCY_DECAY_PER_HOUR}::numeric * (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600)
        )::numeric, ${RELEVANCE_SCORE_PRECISION}) AS relevance_score
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN (
        SELECT ph.post_id, SUM(uta.score) AS topic_score
        FROM post_hashtags ph
        JOIN user_topic_affinity uta ON uta.hashtag_id = ph.hashtag_id AND uta.user_id = $1
        GROUP BY ph.post_id
      ) ta ON ta.post_id = p.id
      LEFT JOIN user_creator_affinity ca ON ca.user_id = $1 AND ca.creator_id = p.user_id
      WHERE ${FEED_VISIBILITY_AND_BLOCK_FILTER}
    ) ranked
    ORDER BY relevance_score DESC, created_at DESC, id DESC
    LIMIT $2;
  `,

  // Candidates the viewer has no established affinity for: unfollowed authors
  // and posts outside communities they've joined. Still passes the same
  // visibility/block/quality filters as the main feed — "not personalized"
  // never means "not vetted".
  getDiscoveryFeedCandidates: `
    SELECT * FROM (
      SELECT
        ${FEED_POST_COLUMNS}
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE ${FEED_VISIBILITY_AND_BLOCK_FILTER}
        AND p.user_id != $1
        AND NOT EXISTS (SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = p.user_id)
        AND (
          p.community_id IS NULL
          OR NOT EXISTS (SELECT 1 FROM community_members WHERE user_id = $1 AND community_id = p.community_id AND status = 'accepted')
        )
        AND p.likes_count + p.reposts_count + p.comments_count > 0
    ) discovery
    ORDER BY created_at DESC
    LIMIT $2;
  `,

  // Highest engagement-velocity posts in a recent window, regardless of the
  // viewer's affinity — the "emerging/highly engaging" discovery slot.
  getTrendingFeedCandidates: `
    SELECT * FROM (
      SELECT
        ${FEED_POST_COLUMNS},
        (p.likes_count + p.reposts_count + p.comments_count)
          / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, ${VELOCITY_MIN_AGE_HOURS}) AS velocity
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE ${FEED_VISIBILITY_AND_BLOCK_FILTER}
        AND p.created_at >= NOW() - INTERVAL '${TRENDING_WINDOW_HOURS} hours'
    ) trending
    ORDER BY velocity DESC
    LIMIT $2;
  `,

  // "Recommended for you" — a discovery surface distinct from the Home feed:
  // only public posts from authors the viewer does NOT already follow/circle
  // with (Home already serves those), scored the same way as the ranked Home
  // feed, and excluding anything the viewer has already been shown (any row
  // in post_impressions) so recommendations don't repeat what was already
  // scrolled past.
  // $1 = offset, $2 = limit (fetchResourceByPage convention), $3 = user_id.
  getRecommendedPosts: `
    SELECT COUNT(*) OVER () as count,
      ${FEED_POST_COLUMNS.replace(/\$1/g, '$3')},
      COALESCE(ta.topic_score, 0) AS topic_affinity_score,
      COALESCE(ca.score, 0) AS creator_affinity_score,
      ROUND((
        ${RELEVANCE_WEIGHTS.TOPIC_AFFINITY}::numeric * COALESCE(ta.topic_score, 0)
        + ${RELEVANCE_WEIGHTS.CREATOR_AFFINITY}::numeric * COALESCE(ca.score, 0)
        + (${ENGAGEMENT_WEIGHTS.LIKE} * p.likes_count + ${ENGAGEMENT_WEIGHTS.REPOST} * p.reposts_count + ${ENGAGEMENT_WEIGHTS.COMMENT} * p.comments_count)
        - ${RELEVANCE_WEIGHTS.RECENCY_DECAY_PER_HOUR}::numeric * (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600)
      )::numeric, ${RELEVANCE_SCORE_PRECISION}) AS relevance_score
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN (
      SELECT ph.post_id, SUM(uta.score) AS topic_score
      FROM post_hashtags ph
      JOIN user_topic_affinity uta ON uta.hashtag_id = ph.hashtag_id AND uta.user_id = $3
      GROUP BY ph.post_id
    ) ta ON ta.post_id = p.id
    LEFT JOIN user_creator_affinity ca ON ca.user_id = $3 AND ca.creator_id = p.user_id
    WHERE p.deleted_at IS NULL
      AND p.status != 'archived'
      AND p.parent_post_id IS NULL
      AND p.visibility = 'public'
      AND p.user_id != $3
      AND NOT EXISTS (SELECT 1 FROM user_follows WHERE follower_id = $3 AND following_id = p.user_id)
      AND NOT EXISTS (SELECT 1 FROM user_connections WHERE user_id = $3 AND connected_user_id = p.user_id AND status = 'accepted')
      AND NOT EXISTS (SELECT 1 FROM post_impressions WHERE user_id = $3 AND post_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $3 AND blocked_id = p.user_id)
           OR (blocker_id = p.user_id AND blocked_id = $3)
      )
    ORDER BY relevance_score DESC, created_at DESC, id DESC
    LIMIT $2 OFFSET $1;
  `,

  // Lifetime interaction count used to route a user to the cold-start feed
  // (Phase 4) instead of the ranked feed above.
  getUserInteractionCount: `
    SELECT (
      (SELECT COUNT(*) FROM post_likes WHERE user_id = $1)
      + (SELECT COUNT(*) FROM comments WHERE user_id = $1 AND deleted_at IS NULL)
      + (SELECT COUNT(*) FROM reposts WHERE user_id = $1)
      + (SELECT COUNT(*) FROM post_bookmarks WHERE user_id = $1)
    ) AS total;
  `,

  // Cold-start feed for users below the interaction threshold: a deliberate mix
  // of freshness, popularity, and forced variety — not the ranked formula with
  // zeroed personalization terms, which would just degrade to recency.
  getColdStartFeed: `
    WITH recent AS (
      SELECT ${FEED_POST_COLUMNS}, 'recent' AS slot
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE ${FEED_VISIBILITY_AND_BLOCK_FILTER} AND p.visibility = 'public'
      ORDER BY p.created_at DESC
      LIMIT $2
    ),
    trending_ranked AS (
      SELECT
        ${FEED_POST_COLUMNS}, 'trending' AS slot,
        (p.likes_count + p.reposts_count + p.comments_count)
          / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, ${VELOCITY_MIN_AGE_HOURS}) AS velocity,
        ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY
          (p.likes_count + p.reposts_count + p.comments_count)
            / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, ${VELOCITY_MIN_AGE_HOURS}) DESC
        ) AS author_rank
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      WHERE ${FEED_VISIBILITY_AND_BLOCK_FILTER}
        AND p.visibility = 'public'
        AND p.created_at >= NOW() - INTERVAL '${COLD_START_TRENDING_WINDOW_HOURS} hours'
    ),
    trending AS (
      SELECT ${FEED_POST_COLUMNS_PLAIN}, slot
      FROM trending_ranked
      WHERE author_rank <= ${COLD_START_MAX_PER_AUTHOR}
      ORDER BY velocity DESC
      LIMIT $2
    ),
    variety_ranked AS (
      SELECT DISTINCT ON (COALESCE(p.community_id, ph.hashtag_id, p.id))
        ${FEED_POST_COLUMNS}, 'variety' AS slot
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      LEFT JOIN post_hashtags ph ON ph.post_id = p.id
      WHERE ${FEED_VISIBILITY_AND_BLOCK_FILTER} AND p.visibility = 'public'
      ORDER BY COALESCE(p.community_id, ph.hashtag_id, p.id), p.created_at DESC
    ),
    variety AS (
      SELECT ${FEED_POST_COLUMNS_PLAIN}, slot FROM variety_ranked
      LIMIT $2
    ),
    merged AS (
      SELECT ${FEED_POST_COLUMNS_PLAIN}, slot FROM recent
      UNION
      SELECT ${FEED_POST_COLUMNS_PLAIN}, slot FROM trending
      UNION
      SELECT ${FEED_POST_COLUMNS_PLAIN}, slot FROM variety
    )
    SELECT COUNT(*) OVER () AS count, * FROM merged
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `,

  getPostsCount: `
    SELECT COUNT(*) as total FROM posts p
    WHERE p.deleted_at IS NULL
      AND p.parent_post_id IS NULL
      AND (
        (p.visibility = 'public')
        OR (p.user_id = $1)
        OR (p.visibility = 'circle_only' AND EXISTS (
          SELECT 1 FROM user_connections
          WHERE user_id = $1 AND connected_user_id = p.user_id AND status = 'accepted'
        ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $1 AND blocked_id = p.user_id)
           OR (blocker_id = p.user_id AND blocked_id = $1)
      );
  `,

  getPostsByUserId: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar,
      u.display_name,
      c.id          AS community_id,
      c.name        AS community_name,
      c.avatar      AS community_avatar,
      (c.owner_id = $5) AS is_community_owner
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.user_id = $3
      AND p.deleted_at IS NULL
      AND p.status != 'archived'
      AND p.parent_post_id IS NULL
      AND ($4::text IS NULL OR p.search_vector @@ plainto_tsquery('english', $4))
      AND (
        (p.visibility = 'public')
        OR (p.user_id = $5)
        OR (p.visibility = 'circle_only' AND EXISTS (
          SELECT 1 FROM user_connections
          WHERE user_id = $5 AND connected_user_id = p.user_id AND status = 'accepted'
        ))
      )
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $5 AND blocked_id = p.user_id)
           OR (blocker_id = p.user_id AND blocked_id = $5)
      )
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getMyPosts: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.display_name,
      u.avatar,
      c.id          AS community_id,
      c.name        AS community_name,
      c.avatar      AS community_avatar,
      (c.owner_id = $3) AS is_community_owner
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE p.user_id = $3
      AND p.deleted_at IS NULL
      AND p.status != 'archived'
      AND p.parent_post_id IS NULL
      AND ($4::text IS NULL OR p.search_vector @@ plainto_tsquery('english', $4))
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getUserPostsCount: `
    SELECT COUNT(*) as total FROM posts 
    WHERE user_id = $1 
      AND deleted_at IS NULL
      AND parent_post_id IS NULL;
  `,

  updatePost: `
    UPDATE posts 
    SET 
      content = COALESCE($2, content),
      visibility = COALESCE($3, visibility),
      media_attachments = COALESCE($4, media_attachments),
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  softDeletePost: `
    UPDATE posts 
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), status = 'deleted'
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  incrementPostCounter: `
    UPDATE posts 
    SET 
      likes_count = likes_count + 1,
      updated_at = NOW()
    WHERE id = $1;
  `,

  decrementPostCounter: `
    UPDATE posts 
    SET 
      likes_count = GREATEST(likes_count - 1, 0),
      updated_at = NOW()
    WHERE id = $1;
  `,

  incrementPostCommentsCounter: `
    UPDATE posts
    SET
      comments_count = comments_count + 1,
      updated_at = NOW()
    WHERE id = $1;
  `,

  incrementCommentRepliesCounter: `
    UPDATE comments
    SET
      replies_count = replies_count + 1,
      updated_at = NOW()
    WHERE id = $1;
  `,

  decrementCommentRepliesCounter: `
    UPDATE comments
    SET
      replies_count = GREATEST(replies_count - 1, 0),
      updated_at = NOW()
    WHERE id = $1;
  `,

  createComment: `
    INSERT INTO comments (
      post_id,
      user_id,
      parent_comment_id,
      content,
      media_attachments
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `,

  getCommentById: `
    SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL;
  `,

  getPostComments: `
    SELECT COUNT(*) OVER () as count,
      c.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $3
      AND c.deleted_at IS NULL
      AND c.parent_comment_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $4 AND blocked_id = c.user_id)
           OR (blocker_id = c.user_id AND blocked_id = $4)
      )
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getPostCommentsCount: `
    SELECT COUNT(*) as total FROM comments
    WHERE post_id = $1
      AND deleted_at IS NULL
      AND parent_comment_id IS NULL;
  `,

  getCommentReplies: `
    SELECT COUNT(*) OVER () as count,
      c.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.parent_comment_id = $3
      AND c.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $4 AND blocked_id = c.user_id)
           OR (blocker_id = c.user_id AND blocked_id = $4)
      )
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $1;
  `,

  updateComment: `
    UPDATE comments 
    SET 
      content = COALESCE($2, content),
      media_attachments = COALESCE($3, media_attachments),
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  softDeleteComment: `
    UPDATE comments 
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  likePost: `
    INSERT INTO post_likes (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  `,

  unlikePost: `
    DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2;
  `,

  isPostLiked: `
    SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2);
  `,

  getPostLikes: `
    SELECT COUNT(*) OVER () as count,
      pl.*, u.username, u.avatar
    FROM post_likes pl
    JOIN users u ON pl.user_id = u.id
    WHERE pl.post_id = $3
    ORDER BY pl.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getPostLikesCount: `
    SELECT COUNT(*) as total FROM post_likes WHERE post_id = $1;
  `,

  getFirstLikers: `
    SELECT u.id, u.username, u.display_name, u.avatar
    FROM post_likes pl
    JOIN users u ON pl.user_id = u.id
    WHERE pl.post_id = $1
    ORDER BY pl.created_at ASC
    LIMIT 3;
  `,

  likeComment: `
    INSERT INTO comment_likes (comment_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (comment_id, user_id) DO NOTHING;
  `,

  unlikeComment: `
    DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2;
  `,

  isCommentLiked: `
    SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2);
  `,

  repost: `
    INSERT INTO reposts (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  `,

  unrepost: `
    DELETE FROM reposts WHERE post_id = $1 AND user_id = $2;
  `,

  isReposted: `
    SELECT EXISTS(SELECT 1 FROM reposts WHERE post_id = $1 AND user_id = $2);
  `,

  getPostReposts: `
    SELECT COUNT(*) OVER () as count,
      r.*, u.username, u.avatar
    FROM reposts r
    JOIN users u ON r.user_id = u.id
    WHERE r.post_id = $3
    ORDER BY r.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getPostRepostsCount: `
    SELECT COUNT(*) as total FROM reposts WHERE post_id = $1;
  `,

  getUserReposts: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar,
      u.display_name,
      c.id          AS community_id,
      c.name        AS community_name,
      c.avatar      AS community_avatar,
      (c.owner_id = $5) AS is_community_owner,
      r.created_at  AS reposted_at
    FROM reposts r
    JOIN posts p ON r.post_id = p.id
    JOIN users u ON p.user_id = u.id
    LEFT JOIN communities c ON p.community_id = c.id
    WHERE r.user_id = $3
      AND p.deleted_at IS NULL
      AND p.status != 'archived'
      AND (
        (p.visibility = 'public')
        OR (p.user_id = $5)
        OR (p.visibility = 'circle_only' AND EXISTS (
          SELECT 1 FROM user_connections
          WHERE user_id = $5 AND connected_user_id = p.user_id AND status = 'accepted'
        ))
      )
      AND ($4::text IS NULL OR p.search_vector @@ plainto_tsquery('english', $4))
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $5 AND blocked_id IN (r.user_id, p.user_id))
           OR (blocked_id = $5 AND blocker_id IN (r.user_id, p.user_id))
      )
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  createPostMention: `
    INSERT INTO post_mentions (post_id, mentioned_user_id, mention_type)
    VALUES ($1, $2, $3)
    ON CONFLICT (post_id, mentioned_user_id) DO NOTHING;
  `,

  bookmarkPost: `
    INSERT INTO post_bookmarks (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  `,

  unbookmarkPost: `
    DELETE FROM post_bookmarks WHERE post_id = $1 AND user_id = $2;
  `,

  isBookmarked: `
    SELECT EXISTS(SELECT 1 FROM post_bookmarks WHERE post_id = $1 AND user_id = $2);
  `,

  getUserBookmarks: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM post_bookmarks pb
    JOIN posts p ON pb.post_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE pb.user_id = $3 AND p.deleted_at IS NULL
    ORDER BY pb.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getUserBookmarksCount: `
    SELECT COUNT(*) as total FROM post_bookmarks 
    WHERE user_id = $1;
  `,

  getQuotePosts: `
    SELECT 
      p.*,
      u.id as user_id,
      u.username,
      u.avatar,
      original.content as original_content,
      original_user.username as original_author
    FROM posts p
    JOIN posts original ON p.parent_post_id = original.id
    JOIN users u ON p.user_id = u.id
    JOIN users original_user ON original.user_id = original_user.id
    WHERE p.parent_post_id = $1 
      AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3;
  `,

  updateContentFlags: `
    UPDATE posts
    SET content_flags = $2, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  unarchivePost: `
    UPDATE posts
    SET status = 'published', updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  getArchivedPosts: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $3
      AND p.deleted_at IS NULL
      AND p.status = 'archived'
    ORDER BY p.updated_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getFollowingFeed: `
    WITH recent_posts AS (
      SELECT
        p.*,
        u.id          AS user_id,
        u.username,
        u.avatar,
        u.display_name,
        c.id          AS community_id,
        c.name        AS community_name,
        c.avatar      AS community_avatar,
        (c.owner_id = $3) AS is_community_owner,
        ROW_NUMBER() OVER (PARTITION BY p.user_id ORDER BY p.created_at DESC) AS rn
      FROM posts p
      JOIN users u        ON p.user_id = u.id
      LEFT JOIN communities c ON p.community_id = c.id
      JOIN user_follows uf ON uf.following_id = p.user_id
      WHERE uf.follower_id = $3
        AND p.deleted_at IS NULL
        AND p.status != 'archived'
        AND p.parent_post_id IS NULL
        AND (
          (p.visibility = 'public')
          OR (p.user_id = $3)
          OR (p.visibility = 'circle_only' AND EXISTS (
            SELECT 1 FROM user_connections
            WHERE user_id = $3 AND connected_user_id = p.user_id AND status = 'accepted'
          ))
        )
        AND NOT EXISTS (
          SELECT 1 FROM user_blocks
          WHERE (blocker_id = $3 AND blocked_id = p.user_id)
             OR (blocker_id = p.user_id AND blocked_id = $3)
        )
    )
    SELECT
      COUNT(*) OVER () AS count,
      *,
      (likes_count * 3 + reposts_count * 2 + comments_count * 1)
        - (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 * 0.5) AS score
    FROM recent_posts
    WHERE rn <= 5
    ORDER BY score DESC
    LIMIT $2 OFFSET $1;
  `,

  isFollowingUser: `
    SELECT EXISTS(
      SELECT 1 FROM user_follows
      WHERE follower_id = $1 AND following_id = $2
    );
  `,

  isInCircleWith: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections
      WHERE user_id = $1 AND connected_user_id = $2 AND status = 'accepted'
    );
  `,

  isPostOwner: `
    SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL);
  `,

  isCommentOnPost: `
    SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1 AND post_id = $2);
  `,

  upsertHashtag: `
    INSERT INTO hashtags (tag, posts_count)
    VALUES ($1, 1)
    ON CONFLICT (tag) DO UPDATE
      SET posts_count = hashtags.posts_count + 1
    RETURNING id, tag, posts_count;
  `,

  createPostHashtag: `
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, hashtag_id) DO NOTHING;
  `,

  decrementHashtagCount: `
    UPDATE hashtags
    SET posts_count = GREATEST(posts_count - 1, 0)
    WHERE id = $1;
  `,

  deletePostHashtags: `
    DELETE FROM post_hashtags WHERE post_id = $1;
  `,

  getHashtagIdsByPostId: `
    SELECT hashtag_id FROM post_hashtags WHERE post_id = $1;
  `,

  getPostHashtags: `
    SELECT h.tag
    FROM post_hashtags ph
    JOIN hashtags h ON ph.hashtag_id = h.id
    WHERE ph.post_id = $1
    ORDER BY h.tag;
  `,

  insertImpressions: `
    INSERT INTO post_impressions (post_id, user_id, source, dwell_ms, skipped)
    SELECT * FROM UNNEST(
      $1::text[],
      $2::text[],
      $3::post_impression_source[],
      $4::int[],
      $5::boolean[]
    );
  `,

  // Nightly affinity aggregation (src/shared/jobs/feed-affinity.job.ts).
  // Weighted events over a trailing window, exponentially decayed by age, rolled
  // up per (user, hashtag). $1 = window start timestamp, $2 = decay half-life in days,
  // $3..$8 = event weights (like, comment, repost, bookmark, dwell, skip),
  // $9 = dwell threshold in ms.
  refreshUserTopicAffinity: `
    INSERT INTO user_topic_affinity (user_id, hashtag_id, score, updated_at)
    SELECT user_id, hashtag_id, SUM(weighted_score), NOW()
    FROM (
      SELECT pl.user_id, ph.hashtag_id,
        $3::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pl.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_likes pl
      JOIN post_hashtags ph ON ph.post_id = pl.post_id
      WHERE pl.created_at >= $1

      UNION ALL

      SELECT c.user_id, ph.hashtag_id,
        $4::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM comments c
      JOIN post_hashtags ph ON ph.post_id = c.post_id
      WHERE c.created_at >= $1 AND c.deleted_at IS NULL

      UNION ALL

      SELECT r.user_id, ph.hashtag_id,
        $5::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM reposts r
      JOIN post_hashtags ph ON ph.post_id = r.post_id
      WHERE r.created_at >= $1

      UNION ALL

      SELECT pb.user_id, ph.hashtag_id,
        $6::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pb.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_bookmarks pb
      JOIN post_hashtags ph ON ph.post_id = pb.post_id
      WHERE pb.created_at >= $1

      UNION ALL

      SELECT pi.user_id, ph.hashtag_id,
        $7::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_impressions pi
      JOIN post_hashtags ph ON ph.post_id = pi.post_id
      WHERE pi.created_at >= $1 AND pi.dwell_ms IS NOT NULL AND pi.dwell_ms >= $9::int

      UNION ALL

      SELECT pi.user_id, ph.hashtag_id,
        $8::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_impressions pi
      JOIN post_hashtags ph ON ph.post_id = pi.post_id
      WHERE pi.created_at >= $1 AND pi.skipped = TRUE
    ) events
    GROUP BY user_id, hashtag_id
    ON CONFLICT (user_id, hashtag_id) DO UPDATE SET
      score = EXCLUDED.score,
      updated_at = NOW();
  `,

  refreshUserCreatorAffinity: `
    INSERT INTO user_creator_affinity (user_id, creator_id, score, updated_at)
    SELECT user_id, creator_id, SUM(weighted_score), NOW()
    FROM (
      SELECT pl.user_id, p.user_id AS creator_id,
        $3::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pl.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_likes pl
      JOIN posts p ON p.id = pl.post_id
      WHERE pl.created_at >= $1

      UNION ALL

      SELECT c.user_id, p.user_id AS creator_id,
        $4::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - c.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM comments c
      JOIN posts p ON p.id = c.post_id
      WHERE c.created_at >= $1 AND c.deleted_at IS NULL

      UNION ALL

      SELECT r.user_id, p.user_id AS creator_id,
        $5::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM reposts r
      JOIN posts p ON p.id = r.post_id
      WHERE r.created_at >= $1

      UNION ALL

      SELECT pb.user_id, p.user_id AS creator_id,
        $6::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pb.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_bookmarks pb
      JOIN posts p ON p.id = pb.post_id
      WHERE pb.created_at >= $1

      UNION ALL

      SELECT pi.user_id, p.user_id AS creator_id,
        $7::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_impressions pi
      JOIN posts p ON p.id = pi.post_id
      WHERE pi.created_at >= $1 AND pi.dwell_ms IS NOT NULL AND pi.dwell_ms >= $9::int

      UNION ALL

      SELECT pi.user_id, p.user_id AS creator_id,
        $8::numeric * EXP(-EXTRACT(EPOCH FROM (NOW() - pi.created_at)) / 86400 / $2::numeric) AS weighted_score
      FROM post_impressions pi
      JOIN posts p ON p.id = pi.post_id
      WHERE pi.created_at >= $1 AND pi.skipped = TRUE
    ) events
    WHERE user_id != creator_id
    GROUP BY user_id, creator_id
    ON CONFLICT (user_id, creator_id) DO UPDATE SET
      score = EXCLUDED.score,
      updated_at = NOW();
  `,

  // Drops affinity rows whose score has aged out of relevance (nothing contributing
  // to them has happened inside the window on the most recent run).
  pruneStaleTopicAffinity: `
    DELETE FROM user_topic_affinity WHERE updated_at < $1;
  `,

  pruneStaleCreatorAffinity: `
    DELETE FROM user_creator_affinity WHERE updated_at < $1;
  `,

  getMentionedUserIds: `
    SELECT id, username FROM users WHERE username = ANY($1::text[]);
  `,

  // Returns id, username, and fcm_token for each mentioned username that has an FCM token
  getMentionedUserTokens: `
    SELECT id, username, fcm_token
    FROM users
    WHERE username = ANY($1::text[])
      AND fcm_token IS NOT NULL
      AND fcm_token != '';
  `,
};
