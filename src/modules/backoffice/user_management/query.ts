// App users as seen from the admin portal. "Restricted" means suspended (and not yet expired)
// or banned; an expired suspension counts as active even before the expiry job records it.

const EFFECTIVE_STANDING = `
  CASE
    WHEN u.moderation_status = 'banned' THEN 'banned'
    WHEN u.moderation_status = 'suspended' AND (u.suspended_until IS NULL OR u.suspended_until > NOW()) THEN 'suspended'
    ELSE 'active'
  END
`;

export default {
  // $1 offset, $2 limit, $3 search, $4 standing (active | suspended | banned | restricted),
  // $5 flagged only, $6 joined from, $7 joined to, $8 sort
  fetchUsers: `
    SELECT u.id, u.username, u.display_name, u.first_name, u.last_name, u.email, u.avatar,
      u.status, ${EFFECTIVE_STANDING} AS moderation_status, u.suspended_until,
      u.created_at, u.last_login,
      (SELECT COUNT(*)::int FROM reports r WHERE r.content_owner_id = u.id) AS reports_against,
      la.action AS last_action, la.reason AS restriction_reason, la.reason_code AS restriction_reason_code,
      la.starts_at AS restricted_at, la.duration_days AS restriction_days, la.created_at AS last_action_at,
      COUNT(*) OVER() AS count
    FROM users u
    LEFT JOIN LATERAL (
      SELECT a.action, a.reason, a.reason_code, a.starts_at, a.duration_days, a.created_at
      FROM user_moderation_actions a
      WHERE a.user_id = u.id AND a.action IN ('suspend', 'ban', 'extend')
      ORDER BY a.created_at DESC
      LIMIT 1
    ) la ON TRUE
    WHERE u.deleted_at IS NULL
      AND ($3 = '' OR $3 IS NULL
        OR u.id = $3
        OR u.username ILIKE '%' || $3 || '%'
        OR u.display_name ILIKE '%' || $3 || '%'
        OR u.email ILIKE '%' || $3 || '%'
        OR CONCAT(u.first_name, ' ', u.last_name) ILIKE '%' || $3 || '%')
      AND ($4::varchar IS NULL
        OR ($4 = 'restricted' AND ${EFFECTIVE_STANDING} <> 'active')
        OR ${EFFECTIVE_STANDING} = $4)
      AND ($5::boolean IS NOT TRUE OR EXISTS (SELECT 1 FROM reports r WHERE r.content_owner_id = u.id))
      AND ($6::date IS NULL OR u.created_at::date >= $6::date)
      AND ($7::date IS NULL OR u.created_at::date <= $7::date)
    ORDER BY
      CASE WHEN $8 = 'username' THEN LOWER(u.username) END ASC NULLS LAST,
      CASE WHEN $8 = 'oldest' THEN u.created_at END ASC,
      CASE WHEN $8 = 'last_login' THEN u.last_login END DESC NULLS LAST,
      CASE WHEN $8 = 'reports' THEN (SELECT COUNT(*) FROM reports r WHERE r.content_owner_id = u.id) END DESC,
      CASE WHEN $8 = 'restricted_recent' THEN la.created_at END DESC NULLS LAST,
      CASE WHEN $8 = 'restriction_type' THEN ${EFFECTIVE_STANDING} END ASC,
      u.created_at DESC
    OFFSET $1 LIMIT $2;
  `,

  fetchUserById: `
    SELECT u.id, u.username, u.display_name, u.first_name, u.last_name, u.email, u.avatar,
      u.header_image, u.bio, u.country_code, u.phone_number, u.status,
      ${EFFECTIVE_STANDING} AS moderation_status, u.suspended_until, u.moderation_updated_at,
      u.created_at, u.activated_at, u.last_login,
      (SELECT COUNT(*)::int FROM posts p WHERE p.user_id = u.id AND p.deleted_at IS NULL) AS posts,
      (SELECT COUNT(*)::int FROM posts p WHERE p.user_id = u.id AND p.hidden_at IS NOT NULL) AS hidden_posts,
      (SELECT COUNT(*)::int FROM comments c WHERE c.user_id = u.id AND c.deleted_at IS NULL) AS comments,
      (SELECT COUNT(*)::int FROM comments c WHERE c.user_id = u.id AND c.hidden_at IS NOT NULL) AS hidden_comments,
      ((SELECT COUNT(*) FROM post_likes l WHERE l.user_id = u.id)
        + (SELECT COUNT(*) FROM comment_likes l WHERE l.user_id = u.id))::int AS likes_given,
      (SELECT COALESCE(SUM(p.likes_count), 0)::int FROM posts p WHERE p.user_id = u.id AND p.deleted_at IS NULL) AS likes_received,
      (SELECT COUNT(*)::int FROM user_follows f WHERE f.follower_id = u.id) AS tribe_following,
      (SELECT COUNT(*)::int FROM user_follows f WHERE f.following_id = u.id) AS tribe_followers,
      (SELECT COUNT(*)::int FROM user_connections uc WHERE uc.user_id = u.id AND uc.status = 'accepted') AS circle,
      (SELECT COUNT(*)::int FROM community_members cm WHERE cm.user_id = u.id AND cm.status = 'accepted') AS communities,
      (SELECT COUNT(*)::int FROM reports r WHERE r.content_owner_id = u.id) AS reports_against,
      (SELECT COUNT(*)::int FROM reports r WHERE r.reporter_id = u.id) AS reports_submitted,
      (SELECT COUNT(*)::int FROM user_warnings w WHERE w.user_id = u.id) AS warnings,
      (SELECT COUNT(*)::int FROM user_moderation_actions a WHERE a.user_id = u.id AND a.action IN ('suspend', 'ban')) AS enforcement_actions,
      (SELECT COUNT(*)::int FROM user_notes n WHERE n.user_id = u.id AND n.deleted_at IS NULL) AS notes
    FROM users u
    WHERE u.id = $1 AND u.deleted_at IS NULL;
  `,

  // Reported posts and comments by this user, one row per item. $3 user id, $4 sort.
  fetchFlaggedContent: `
    SELECT r.entity_type, r.entity_id,
      COUNT(*)::int AS report_count,
      ARRAY_AGG(DISTINCT COALESCE(rr.label, r.reason)) AS reasons,
      MAX(COALESCE(rr.severity, 1))::int AS severity,
      MIN(r.created_at) AS first_reported_at,
      MAX(r.created_at) AS last_reported_at,
      BOOL_OR(r.status <> 'resolved') AS has_open_reports,
      COALESCE(p.content, c.content) AS content,
      COALESCE(p.media_attachments, c.media_attachments) AS media,
      COALESCE(p.created_at, c.created_at) AS posted_at,
      COALESCE(p.hidden_at, c.hidden_at) AS hidden_at,
      (COALESCE(p.deleted_at, c.deleted_at) IS NOT NULL AND COALESCE(p.hidden_at, c.hidden_at) IS NULL) AS deleted_by_author,
      c.post_id,
      COUNT(*) OVER() AS count
    FROM reports r
    LEFT JOIN report_reasons rr ON rr.code = r.reason_code
    LEFT JOIN posts p ON r.entity_type = 'post' AND p.id = r.entity_id
    LEFT JOIN comments c ON r.entity_type = 'comment' AND c.id = r.entity_id
    WHERE r.content_owner_id = $3 AND r.entity_type IN ('post', 'comment')
    GROUP BY r.entity_type, r.entity_id, p.content, c.content, p.media_attachments, c.media_attachments,
      p.created_at, c.created_at, p.hidden_at, c.hidden_at, p.deleted_at, c.deleted_at, c.post_id
    ORDER BY
      CASE WHEN $4 = 'severity' THEN MAX(COALESCE(rr.severity, 1)) END DESC NULLS LAST,
      CASE WHEN $4 = 'reports' THEN COUNT(*) END DESC NULLS LAST,
      MAX(r.created_at) DESC
    OFFSET $1 LIMIT $2;
  `,

  fetchActions: `
    SELECT a.id, a.action, a.reason_code, a.reason, a.note, a.duration_days, a.starts_at, a.ends_at,
      a.report_id, a.notified, a.created_at,
      a.performed_by_admin_id, NULLIF(TRIM(CONCAT(ad.first_name, ' ', ad.last_name)), '') AS performed_by_name
    FROM user_moderation_actions a
    LEFT JOIN admins ad ON ad.id = a.performed_by_admin_id
    WHERE a.user_id = $1
    ORDER BY a.created_at DESC
    LIMIT 200;
  `,

  fetchWarnings: `
    SELECT w.id, w.template_key, w.message, w.report_id, w.emailed, w.acknowledged_at, w.created_at,
      w.sent_by_admin_id, NULLIF(TRIM(CONCAT(ad.first_name, ' ', ad.last_name)), '') AS sent_by_name
    FROM user_warnings w
    LEFT JOIN admins ad ON ad.id = w.sent_by_admin_id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC
    LIMIT 200;
  `,

  fetchNotes: `
    SELECT n.id, n.body, n.tag, n.created_at, n.updated_at, n.author_admin_id,
      NULLIF(TRIM(CONCAT(ad.first_name, ' ', ad.last_name)), '') AS author_name
    FROM user_notes n
    LEFT JOIN admins ad ON ad.id = n.author_admin_id
    WHERE n.user_id = $1 AND n.deleted_at IS NULL
    ORDER BY n.created_at DESC;
  `,

  findNote: `
    SELECT id, user_id, author_admin_id, body, tag FROM user_notes
    WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL FOR UPDATE;
  `,

  createNote: `
    INSERT INTO user_notes (user_id, author_admin_id, body, tag)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `,

  updateNote: `
    UPDATE user_notes SET body = $2, tag = $3, updated_at = NOW() WHERE id = $1;
  `,

  deleteNote: `
    UPDATE user_notes SET deleted_at = NOW() WHERE id = $1;
  `,

  userExists: `
    SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL;
  `,

  // ---- app-side warning acknowledgement
  pendingWarnings: `
    SELECT id, message, template_key, created_at FROM user_warnings
    WHERE user_id = $1 AND acknowledged_at IS NULL
    ORDER BY created_at ASC;
  `,

  acknowledgeWarning: `
    UPDATE user_warnings SET acknowledged_at = NOW()
    WHERE id = $1 AND user_id = $2 AND acknowledged_at IS NULL
    RETURNING id;
  `,
};
