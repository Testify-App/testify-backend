"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    getProfileByUserId: `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.country_code,
      u.phone_number,
      u.email,
      u.avatar,
      u.display_name,
      u.header_image,
      u.username,
      u.bio,
      u.instagram,
      u.youtube,
      u.twitter,
      u.created_at,
      u.updated_at,
      COALESCE(posts_count.count, 0) as posts_count,
      COALESCE(tribes_count.count, 0) as tribes_count,
      COALESCE(circles_count.count, 0) as circles_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) as count 
      FROM posts 
      WHERE deleted_at IS NULL
      GROUP BY user_id
    ) posts_count ON u.id = posts_count.user_id
    LEFT JOIN (
      SELECT follower_id, COUNT(*) as count 
      FROM user_follows 
      GROUP BY follower_id
    ) tribes_count ON u.id = tribes_count.follower_id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as count 
      FROM user_connections 
      WHERE status = 'accepted'
      GROUP BY user_id
    ) circles_count ON u.id = circles_count.user_id
    WHERE u.id = $1;
  `,
    getByUsername: `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.country_code,
      u.phone_number,
      u.email,
      u.avatar,
      u.username,
      u.bio,
      u.instagram,
      u.youtube,
      u.twitter,
      u.created_at,
      u.updated_at
    FROM users u
    WHERE LOWER(u.username) = LOWER($1);
  `,
    updateProfile: `
    UPDATE users 
    SET 
      first_name = COALESCE($2, first_name),
      last_name = COALESCE($3, last_name),
      country_code = COALESCE($4, country_code),
      phone_number = COALESCE($5, phone_number),
      avatar = COALESCE($6, avatar),
      username = COALESCE($7, username),
      bio = COALESCE($8, bio),
      instagram = COALESCE($9, instagram),
      youtube = COALESCE($10, youtube),
      twitter = COALESCE($11, twitter),
      display_name = COALESCE($12, first_name),
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, first_name, last_name, country_code, phone_number, email, avatar, username, header_image, display_name, bio, instagram, youtube, twitter, created_at, updated_at;
  `,
    addToTribe: `
    INSERT INTO user_follows (follower_id, following_id)
    VALUES ($1, $2)
    ON CONFLICT (follower_id, following_id) DO NOTHING
    RETURNING *;
  `,
    removeFromTribe: `
    DELETE FROM user_follows
    WHERE follower_id = $1 AND following_id = $2;
  `,
    getTribeMembers: `
    SELECT COUNT(*) OVER () as count,
      u.id,
      u.username,
      u.display_name,
      u.avatar,
      uf.created_at as followed_at
    FROM user_follows uf
    JOIN users u ON uf.following_id = u.id
    WHERE uf.follower_id = $3
    ORDER BY uf.created_at DESC
  `,
    searchProfilesByUsername: `
    SELECT COUNT(*) OVER () as count,
      u.id,
      u.first_name,
      u.last_name,
      u.username,
      u.display_name,
      u.avatar,
      u.bio,
      u.created_at
    FROM users u
    WHERE LOWER(u.username) LIKE LOWER($3)
    ORDER BY u.created_at DESC
  `,
    fetchProfilePostHistoryById: `
    SELECT COUNT(*) OVER () as count,
      p.id as post_id,
      p.content,
      p.post_type,
      p.visibility,
      p.media_attachments,
      p.likes_count,
      p.comments_count,
      p.reposts_count,
      p.quotes_count,
      p.parent_post_id,
      p.quote_text,
      p.created_at as post_created_at,
      p.updated_at as post_updated_at
    FROM posts p
    WHERE p.user_id = $3
    ORDER BY p.created_at DESC
  `,
    getTribeCount: `
    SELECT COUNT(*) as total FROM user_follows
    WHERE follower_id = $1;
  `,
    isInTribe: `
    SELECT EXISTS(
      SELECT 1 FROM user_follows
      WHERE follower_id = $1 AND following_id = $2
    );
  `,
    getFollowerCount: `
    SELECT COUNT(*) as total FROM user_follows
    WHERE following_id = $1;
  `,
    checkUserExists: `
    SELECT EXISTS(SELECT 1 FROM users WHERE id = $1);
  `,
    sendCircleRequest: `
    INSERT INTO user_connections (user_id, connected_user_id, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (user_id, connected_user_id) DO NOTHING
    RETURNING *;
  `,
    acceptCircleRequest: `
    UPDATE user_connections
    SET status = 'accepted', updated_at = NOW()
    WHERE id = $1 AND connected_user_id = $2 AND status = 'pending'
    RETURNING *;
  `,
    createMutualConnection: `
    INSERT INTO user_connections (user_id, connected_user_id, status)
    VALUES ($1, $2, 'accepted')
    ON CONFLICT (user_id, connected_user_id) DO NOTHING
    RETURNING *;
  `,
    rejectCircleRequest: `
    UPDATE user_connections
    SET status = 'rejected', updated_at = NOW()
    WHERE id = $1 AND connected_user_id = $2 AND status = 'pending'
    RETURNING *;
  `,
    removeFromCircle: `
    DELETE FROM user_connections
    WHERE (user_id = $1 AND connected_user_id = $2 AND status = 'accepted')
       OR (user_id = $2 AND connected_user_id = $1 AND status = 'accepted');
  `,
    getCircleMembers: `
    SELECT u.id, u.username, u.avatar, uc.updated_at as connected_at
    FROM user_connections uc
    JOIN users u ON uc.connected_user_id = u.id
    WHERE uc.user_id = $1 AND uc.status = 'accepted'
    ORDER BY uc.updated_at DESC
    LIMIT $2 OFFSET $3;
  `,
    getCircleCount: `
    SELECT COUNT(*) as total FROM user_connections
    WHERE user_id = $1 AND status = 'accepted';
  `,
    isInCircle: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections
      WHERE user_id = $1 AND connected_user_id = $2 AND status = 'accepted'
    );
  `,
    getPendingRequests: `
    SELECT uc.*, u.username, u.avatar
    FROM user_connections uc
    JOIN users u ON uc.user_id = u.id
    WHERE uc.connected_user_id = $1 AND uc.status = 'pending'
    ORDER BY uc.created_at DESC;
  `,
    getSentRequests: `
    SELECT uc.*, u.username, u.avatar
    FROM user_connections uc
    JOIN users u ON uc.connected_user_id = u.id
    WHERE uc.user_id = $1 AND uc.status = 'pending'
    ORDER BY uc.created_at DESC;
  `,
    hasPendingRequest: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections
      WHERE (user_id = $1 AND connected_user_id = $2 AND status = 'pending')
         OR (user_id = $2 AND connected_user_id = $1 AND status = 'pending')
    );
  `,
    getRequestById: `
    SELECT * FROM user_connections WHERE id = $1 AND connected_user_id = $2;
  `,
};
//# sourceMappingURL=query.js.map