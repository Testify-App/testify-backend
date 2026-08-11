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
      u.display_name AS owner_display_name,
      (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id AND p.deleted_at IS NULL AND p.status != 'deleted') AS testimonies_count
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.id = $1;
  `,

  exploreCommunities: `
    SELECT
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
        WHERE cm.community_id = c.id AND cm.user_id = $1
      ) AS is_member,
      (c.owner_id = $1) AS is_owner
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.visibility = 'public'
      AND c.owner_id != $1
    ORDER BY c.members_count DESC
    LIMIT 10;
  `,

  recommendedCommunities: `
    SELECT
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
        WHERE cm.community_id = c.id AND cm.user_id = $1
      ) AS is_member,
      (c.owner_id = $1) AS is_owner
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.visibility = 'public'
      AND c.owner_id != $1
      AND NOT EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = c.id AND cm.user_id = $1
      )
    ORDER BY RANDOM()
    LIMIT 5;
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

  getAllUserCommunities: `
    SELECT COUNT(*) OVER () AS count,
      c.*,
      u.username     AS owner_username,
      u.avatar       AS owner_avatar,
      u.display_name AS owner_display_name,
      TRUE           AS is_owner,
      c.created_at   AS sort_at
    FROM communities c
    JOIN users u ON c.owner_id = u.id
    WHERE c.owner_id = $3

    UNION ALL

    SELECT COUNT(*) OVER () AS count,
      c.*,
      u.username     AS owner_username,
      u.avatar       AS owner_avatar,
      u.display_name AS owner_display_name,
      FALSE          AS is_owner,
      cm.joined_at   AS sort_at
    FROM community_members cm
    JOIN communities c ON cm.community_id = c.id
    JOIN users u ON c.owner_id = u.id
    WHERE cm.user_id = $3 AND cm.status = 'accepted'

    ORDER BY sort_at DESC
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
    UPDATE posts
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW(), status = 'deleted'
    WHERE id = $1 AND community_id = $3 AND deleted_at IS NULL
    RETURNING id;
  `,

  pinTestimony: `
    UPDATE posts SET is_pinned = TRUE, updated_at = NOW()
    WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL
    RETURNING id;
  `,

  unpinTestimony: `
    UPDATE posts SET is_pinned = FALSE, updated_at = NOW()
    WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL
    RETURNING id;
  `,

  unpinAllTestimonies: `
    UPDATE posts SET is_pinned = FALSE, updated_at = NOW()
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

  getCommunityTestimonies: `
    SELECT COUNT(*) OVER () AS count,
      p.id,
      p.user_id,
      p.community_id,
      p.content,
      p.post_type,
      p.media_attachments,
      p.is_pinned,
      p.likes_count,
      p.comments_count,
      p.created_at,
      p.updated_at,
      u.username         AS author_username,
      u.avatar           AS author_avatar,
      u.display_name     AS author_display_name,
      c.name             AS community_name,
      c.avatar           AS community_avatar,
      EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $4) AS is_liked
    FROM posts p
    JOIN users       u ON p.user_id      = u.id
    JOIN communities c ON p.community_id = c.id
    WHERE p.community_id = $3
      AND p.deleted_at IS NULL
      AND p.status != 'deleted'
    ORDER BY p.is_pinned DESC, p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getUserCommunityTestimonies: `
    SELECT COUNT(*) OVER () AS count,
      p.id,
      p.user_id,
      p.community_id,
      p.content,
      p.post_type,
      p.media_attachments,
      p.is_pinned,
      p.likes_count,
      p.comments_count,
      p.created_at,
      p.updated_at,
      u.username         AS author_username,
      u.avatar           AS author_avatar,
      u.display_name     AS author_display_name,
      c.name             AS community_name,
      c.avatar           AS community_avatar,
      EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = $4) AS is_liked
    FROM posts p
    JOIN users       u ON p.user_id      = u.id
    JOIN communities c ON p.community_id = c.id
    WHERE p.user_id = $3
      AND p.community_id IS NOT NULL
      AND p.deleted_at IS NULL
      AND p.status != 'deleted'
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,
};
