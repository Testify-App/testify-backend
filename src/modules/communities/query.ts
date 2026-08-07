export default {
  createCommunity: `
    INSERT INTO communities (owner_id, name, description, category, avatar, cover_image, visibility, rules)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `,

  getCommunityById: `
    SELECT
      c.*,
      u.username     AS owner_username,
      u.avatar       AS owner_avatar,
      u.display_name AS owner_display_name
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id = $1;
  `,

  getMyCommunities: `
    SELECT COUNT(*) OVER () as count,
      c.*,
      u.username     AS owner_username,
      u.avatar       AS owner_avatar,
      u.display_name AS owner_display_name
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.owner_id = $3
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getJoinedCommunities: `
    SELECT COUNT(*) OVER () as count,
      c.*,
      u.username     AS owner_username,
      u.avatar       AS owner_avatar,
      u.display_name AS owner_display_name
    FROM community_members cm
    JOIN communities c ON cm.community_id = c.id
    JOIN users u ON c.owner_id = u.id
    WHERE cm.user_id = $3 AND cm.status = 'accepted'
    ORDER BY cm.joined_at DESC
    LIMIT $2 OFFSET $1;
  `,

  isCommunityOwner: `
    SELECT EXISTS(SELECT 1 FROM communities WHERE id = $1 AND owner_id = $2);
  `,

  updateCommunity: `
    UPDATE communities
    SET
      name        = COALESCE($2, name),
      description = COALESCE($3, description),
      category    = COALESCE($4, category),
      avatar      = COALESCE($5, avatar),
      cover_image = COALESCE($6, cover_image),
      visibility  = COALESCE($7::community_visibility, visibility),
      rules       = COALESCE($8::jsonb, rules),
      updated_at  = NOW()
    WHERE id = $1 AND owner_id = $9
    RETURNING *;
  `,

  deleteCommunity: `
    DELETE FROM communities WHERE id = $1 AND owner_id = $2;
  `,

  getMemberStatus: `
    SELECT status FROM community_members WHERE community_id = $1 AND user_id = $2;
  `,

  joinCommunity: `
    INSERT INTO community_members (community_id, user_id, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (community_id, user_id) DO NOTHING
    RETURNING *;
  `,

  leaveCommunity: `
    DELETE FROM community_members WHERE community_id = $1 AND user_id = $2 RETURNING *;
  `,

  incrementMembersCount: `
    UPDATE communities SET members_count = members_count + 1 WHERE id = $1;
  `,

  decrementMembersCount: `
    UPDATE communities SET members_count = GREATEST(members_count - 1, 0) WHERE id = $1;
  `,

  getCommunityMembers: `
    SELECT COUNT(*) OVER () as count,
      cm.status,
      cm.joined_at,
      u.id,
      u.username,
      u.avatar,
      u.display_name
    FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = $3 AND cm.status = 'accepted'
    ORDER BY cm.joined_at ASC
    LIMIT $2 OFFSET $1;
  `,

  getPendingRequests: `
    SELECT COUNT(*) OVER () as count,
      cm.joined_at AS requested_at,
      u.id,
      u.username,
      u.avatar,
      u.display_name
    FROM community_members cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.community_id = $3 AND cm.status = 'pending'
    ORDER BY cm.joined_at ASC
    LIMIT $2 OFFSET $1;
  `,

  acceptJoinRequest: `
    UPDATE community_members
    SET status = 'accepted'
    WHERE community_id = $1 AND user_id = $2 AND status = 'pending'
    RETURNING *;
  `,

  declineJoinRequest: `
    DELETE FROM community_members
    WHERE community_id = $1 AND user_id = $2 AND status = 'pending'
    RETURNING *;
  `,

  removeMember: `
    DELETE FROM community_members WHERE community_id = $1 AND user_id = $2 RETURNING status;
  `,

  banMember: `
    INSERT INTO community_bans (community_id, user_id, banned_by, reason)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (community_id, user_id) DO NOTHING
    RETURNING *;
  `,

  isBanned: `
    SELECT EXISTS(SELECT 1 FROM community_bans WHERE community_id = $1 AND user_id = $2);
  `,

  removeTestimony: `
    UPDATE community_posts
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), status = 'deleted'
    WHERE id = $1 AND community_id = $3 AND deleted_at IS NULL
    RETURNING id;
  `,

  pinTestimony: `
    UPDATE community_posts SET is_pinned = TRUE, updated_at = NOW()
    WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL
    RETURNING id;
  `,

  unpinTestimony: `
    UPDATE community_posts SET is_pinned = FALSE, updated_at = NOW()
    WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL
    RETURNING id;
  `,

  unpinAllTestimonies: `
    UPDATE community_posts SET is_pinned = FALSE, updated_at = NOW()
    WHERE community_id = $1 AND is_pinned = TRUE;
  `,

  reportCommunity: `
    INSERT INTO community_reports (community_id, reporter_id, entity_type, entity_id, reason)
    VALUES ($1, $2, 'community', $1, $3)
    ON CONFLICT (community_id, reporter_id, entity_type, entity_id) DO NOTHING
    RETURNING *;
  `,

  reportTestimony: `
    INSERT INTO community_reports (community_id, reporter_id, entity_type, entity_id, reason)
    VALUES ($1, $2, 'testimony', $3, $4)
    ON CONFLICT (community_id, reporter_id, entity_type, entity_id) DO NOTHING
    RETURNING *;
  `,

  getReportedContent: `
    SELECT COUNT(*) OVER () as count,
      cr.*,
      u.username AS reporter_username,
      u.avatar   AS reporter_avatar
    FROM community_reports cr
    JOIN users u ON cr.reporter_id = u.id
    WHERE cr.community_id = $3 AND cr.status = 'pending'
    ORDER BY cr.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  updateReportStatus: `
    UPDATE community_reports
    SET status = $3, reviewed_by = $4, reviewed_at = NOW()
    WHERE id = $1 AND community_id = $2
    RETURNING *;
  `,

  createCommunityPost: `
    INSERT INTO community_posts (
      community_id,
      user_id,
      content,
      post_type,
      media_attachments,
      status
    ) VALUES ($1, $2, $3, $4, $5, 'published')
    RETURNING *;
  `,

  getCommunityTestimonies: `
    SELECT COUNT(*) OVER () AS count,
      cp.id,
      cp.user_id,
      cp.community_id,
      cp.content,
      cp.post_type,
      cp.media_attachments,
      cp.is_pinned,
      cp.likes_count,
      cp.comments_count,
      cp.created_at,
      cp.updated_at,
      u.username         AS author_username,
      u.avatar           AS author_avatar,
      u.display_name     AS author_display_name,
      c.name             AS community_name,
      c.avatar           AS community_avatar,
      EXISTS(SELECT 1 FROM community_post_likes cpl WHERE cpl.community_post_id = cp.id AND cpl.user_id = $4) AS is_liked
    FROM community_posts cp
    JOIN users       u ON cp.user_id      = u.id
    JOIN communities c ON cp.community_id = c.id
    WHERE cp.community_id = $3
      AND cp.deleted_at IS NULL
      AND cp.status != 'deleted'
    ORDER BY cp.is_pinned DESC, cp.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getUserCommunityTestimonies: `
    SELECT COUNT(*) OVER () AS count,
      cp.id,
      cp.user_id,
      cp.community_id,
      cp.content,
      cp.post_type,
      cp.media_attachments,
      cp.is_pinned,
      cp.likes_count,
      cp.comments_count,
      cp.created_at,
      cp.updated_at,
      u.username         AS author_username,
      u.avatar           AS author_avatar,
      u.display_name     AS author_display_name,
      c.name             AS community_name,
      c.avatar           AS community_avatar,
      EXISTS(SELECT 1 FROM community_post_likes cpl WHERE cpl.community_post_id = cp.id AND cpl.user_id = $4) AS is_liked
    FROM community_posts cp
    JOIN users       u ON cp.user_id      = u.id
    JOIN communities c ON cp.community_id = c.id
    WHERE cp.user_id = $3
      AND cp.deleted_at IS NULL
      AND cp.status != 'deleted'
    ORDER BY cp.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  likeTestimony: `
    INSERT INTO community_post_likes (community_post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (community_post_id, user_id) DO NOTHING
    RETURNING *;
  `,

  unlikeTestimony: `
    DELETE FROM community_post_likes WHERE community_post_id = $1 AND user_id = $2;
  `,

  incrementTestimonyLikes: `
    UPDATE community_posts SET likes_count = likes_count + 1, updated_at = NOW() WHERE id = $1;
  `,

  decrementTestimonyLikes: `
    UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW() WHERE id = $1;
  `,

  getTestimonyById: `
    SELECT cp.*,
      u.username AS author_username,
      u.avatar   AS author_avatar,
      u.display_name AS author_display_name,
      c.name     AS community_name,
      c.avatar   AS community_avatar
    FROM community_posts cp
    JOIN users u       ON cp.user_id      = u.id
    JOIN communities c ON cp.community_id = c.id
    WHERE cp.id = $1 AND cp.deleted_at IS NULL;
  `,
};
