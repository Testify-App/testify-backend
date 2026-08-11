"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    searchPosts: `
    SELECT COUNT(*) OVER () AS count,
      p.id,
      p.content,
      p.post_type,
      p.visibility,
      p.media_attachments,
      p.likes_count,
      p.comments_count,
      p.reposts_count,
      p.quotes_count,
      p.created_at,
      p.updated_at,
      u.id          AS user_id,
      u.username,
      u.display_name,
      u.avatar,
      ts_rank(p.search_vector, plainto_tsquery('english', $3)) AS rank
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.search_vector @@ plainto_tsquery('english', $3)
      AND p.deleted_at IS NULL
      AND p.status != 'archived'
      AND p.parent_post_id IS NULL
      AND p.visibility = 'public'
    ORDER BY rank DESC, p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,
    searchProfiles: `
    SELECT COUNT(*) OVER () AS count,
      u.id,
      u.username,
      u.display_name,
      u.avatar,
      u.bio,
      u.created_at,
      ts_rank(u.search_vector, plainto_tsquery('simple', $3)) AS rank
    FROM users u
    WHERE u.search_vector @@ plainto_tsquery('simple', $3)
    ORDER BY rank DESC, u.created_at DESC
    LIMIT $2 OFFSET $1;
  `,
    searchHashtags: `
    SELECT tag, posts_count
    FROM hashtags
    WHERE tag ILIKE $1 || '%'
    ORDER BY posts_count DESC
    LIMIT 10;
  `,
    searchCommunities: `
    SELECT COUNT(*) OVER () AS count,
      c.id,
      c.name,
      c.description,
      c.category,
      c.avatar,
      c.cover_image,
      c.visibility,
      c.members_count,
      c.created_at,
      u.username     AS owner_username,
      u.avatar       AS owner_avatar,
      u.display_name AS owner_display_name,
      (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id AND p.deleted_at IS NULL AND p.status != 'deleted') AS testimonies_count,
      EXISTS(
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = c.id AND cm.user_id = $4
      ) AS is_member,
      (c.owner_id = $4) AS is_owner,
      ts_rank(c.search_vector, plainto_tsquery('simple', $3)) AS rank
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.search_vector @@ plainto_tsquery('simple', $3)
      AND c.visibility = 'public'
    ORDER BY rank DESC, c.members_count DESC
    LIMIT $2 OFFSET $1;
  `,
};
//# sourceMappingURL=query.js.map