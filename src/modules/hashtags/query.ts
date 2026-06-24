export default {

  getHashtagByTag: `
    SELECT id, tag, posts_count, created_at
    FROM hashtags
    WHERE tag = $1;
  `,

  getPostsByHashtag: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id       AS user_id,
      u.username,
      u.display_name,
      u.avatar,
      ARRAY_AGG(h2.tag ORDER BY h2.tag) AS hashtags
    FROM post_hashtags ph
    JOIN hashtags h     ON ph.hashtag_id = h.id
    JOIN posts p        ON ph.post_id = p.id
    JOIN users u        ON p.user_id = u.id
    LEFT JOIN post_hashtags ph2 ON ph2.post_id = p.id
    LEFT JOIN hashtags h2       ON ph2.hashtag_id = h2.id
    WHERE h.tag = $3
      AND p.deleted_at IS NULL
      AND p.parent_post_id IS NULL
      AND (p.visibility = 'public' OR p.user_id = $4)
    GROUP BY p.id, u.id, u.username, u.display_name, u.avatar
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getTrendingHashtags: `
    SELECT id, tag, created_at
    FROM hashtags
    WHERE posts_count > 0
    ORDER BY posts_count DESC
    LIMIT $1;
  `,

  searchHashtagsByPrefix: `
    SELECT tag, posts_count
    FROM hashtags
    WHERE tag ILIKE $1 || '%'
    ORDER BY posts_count DESC
    LIMIT 10;
  `,
};
