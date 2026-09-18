export default {
  createStory: `
    INSERT INTO stories (user_id, content_type, media_url, thumbnail_url, text_content, background_style, duration)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `,

  getStoryById: `
    SELECT s.*,
      u.username     AS author_username,
      u.avatar       AS author_avatar,
      u.display_name AS author_display_name
    FROM stories s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = $1 AND s.deleted_at IS NULL AND s.expires_at > NOW();
  `,

  isOwnerOrInCircle: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections
      WHERE user_id = $1 AND connected_user_id = $2 AND status = 'accepted'
    );
  `,

  getCircleStories: `
    SELECT
      s.id,
      s.user_id,
      s.content_type,
      s.media_url,
      s.thumbnail_url,
      s.text_content,
      s.background_style,
      s.duration,
      s.views_count,
      s.created_at,
      s.expires_at,
      u.username     AS author_username,
      u.avatar       AS author_avatar,
      u.display_name AS author_display_name,
      EXISTS(
        SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = $1
      ) AS is_viewed
    FROM stories s
    JOIN users u ON s.user_id = u.id
    WHERE s.deleted_at IS NULL
      AND s.expires_at > NOW()
      AND s.user_id IN (
        SELECT connected_user_id FROM user_connections
        WHERE user_id = $1 AND status = 'accepted'
      )
    ORDER BY s.user_id, s.created_at ASC;
  `,

  getMyStories: `
    SELECT
      s.id,
      s.user_id,
      s.content_type,
      s.media_url,
      s.thumbnail_url,
      s.text_content,
      s.background_style,
      s.duration,
      s.views_count,
      s.created_at,
      s.expires_at,
      u.username     AS author_username,
      u.avatar       AS author_avatar,
      u.display_name AS author_display_name,
      TRUE AS is_viewed
    FROM stories s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = $1
      AND s.deleted_at IS NULL
      AND s.expires_at > NOW()
    ORDER BY s.created_at ASC;
  `,

  deleteStory: `
    UPDATE stories
    SET deleted_at = NOW()
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
    RETURNING id;
  `,

  recordView: `
    INSERT INTO story_views (story_id, viewer_id)
    VALUES ($1, $2)
    ON CONFLICT (story_id, viewer_id) DO NOTHING
    RETURNING *;
  `,

  incrementViewsCount: `
    UPDATE stories SET views_count = views_count + 1 WHERE id = $1;
  `,

  getStoryViewers: `
    SELECT COUNT(*) OVER () AS count,
      u.id,
      u.username,
      u.avatar,
      u.display_name,
      sv.viewed_at
    FROM story_views sv
    JOIN users u ON sv.viewer_id = u.id
    WHERE sv.story_id = $3
    ORDER BY sv.viewed_at DESC
    LIMIT $2 OFFSET $1;
  `,

  deleteExpiredStories: `
    DELETE FROM stories
    WHERE expires_at < NOW() - INTERVAL '7 days'
       OR (deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '7 days')
    RETURNING id, media_url, thumbnail_url;
  `,
};
