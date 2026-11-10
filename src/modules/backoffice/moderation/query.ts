// Moderation queue over the app's `reports` table. Reported content is joined per entity type:
// posts, comments, messages, and users (a user report's entity is the reported user).

const REPORT_COLUMNS = `
  r.id, r.entity_type, r.entity_id, r.reason, r.reason_code, r.details, r.status,
  r.decision, r.account_action, r.resolution_notes, r.created_at, r.review_started_at,
  r.resolved_at, r.context_conversation_id,
  rr.label AS reason_label, COALESCE(rr.severity, 1) AS severity,
  reporter.id AS reporter_id, reporter.username AS reporter_username,
  reporter.display_name AS reporter_display_name, reporter.avatar AS reporter_avatar,
  owner.id AS owner_id, owner.username AS owner_username,
  owner.display_name AS owner_display_name, owner.avatar AS owner_avatar,
  owner.moderation_status AS owner_moderation_status, owner.suspended_until AS owner_suspended_until,
  COALESCE(reviewer.id, assignee.id) AS moderator_id,
  NULLIF(TRIM(CONCAT(COALESCE(reviewer.first_name, assignee.first_name), ' ',
    COALESCE(reviewer.last_name, assignee.last_name))), '') AS moderator_name,
  CASE r.entity_type
    WHEN 'post' THEN p.content
    WHEN 'comment' THEN c.content
    WHEN 'message' THEN m.content
    WHEN 'user' THEN COALESCE(owner.bio, '')
  END AS content_text,
  CASE r.entity_type
    WHEN 'post' THEN p.media_attachments
    WHEN 'comment' THEN c.media_attachments
    WHEN 'message' THEN CASE WHEN m.media_url IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array(jsonb_build_object('url', m.media_url)) END
    ELSE '[]'::jsonb
  END AS content_media,
  CASE r.entity_type
    WHEN 'post' THEN p.created_at
    WHEN 'comment' THEN c.created_at
    WHEN 'message' THEN m.created_at
    WHEN 'user' THEN owner.created_at
  END AS content_created_at,
  CASE r.entity_type WHEN 'post' THEN p.hidden_at WHEN 'comment' THEN c.hidden_at END AS content_hidden_at,
  CASE r.entity_type
    WHEN 'post' THEN (p.deleted_at IS NOT NULL AND p.hidden_at IS NULL)
    WHEN 'comment' THEN (c.deleted_at IS NOT NULL AND c.hidden_at IS NULL)
    WHEN 'message' THEN COALESCE(m.is_unsent, FALSE)
    ELSE (owner.deleted_at IS NOT NULL)
  END AS content_deleted,
  c.post_id AS comment_post_id
`;

const REPORT_JOINS = `
  FROM reports r
  JOIN users reporter ON reporter.id = r.reporter_id
  JOIN users owner ON owner.id = r.content_owner_id
  LEFT JOIN report_reasons rr ON rr.code = r.reason_code
  LEFT JOIN admins reviewer ON reviewer.id = r.reviewed_by_admin_id
  LEFT JOIN admins assignee ON assignee.id = r.assigned_admin_id
  LEFT JOIN posts p ON r.entity_type = 'post' AND p.id = r.entity_id
  LEFT JOIN comments c ON r.entity_type = 'comment' AND c.id = r.entity_id
  LEFT JOIN messages m ON r.entity_type = 'message' AND m.id = r.entity_id
`;

export default {
  // $1 offset, $2 limit, $3 search, $4 status, $5 reason code, $6 entity type, $7 from, $8 to,
  // $9 moderator admin id, $10 sort (newest | oldest | severity), $11 owner id, $12 reporter id
  fetchReports: `
    SELECT ${REPORT_COLUMNS}, COUNT(*) OVER() AS count
    ${REPORT_JOINS}
    WHERE ($3 = '' OR $3 IS NULL
        OR r.id ILIKE $3 || '%'
        OR r.entity_id ILIKE $3 || '%'
        OR reporter.username ILIKE '%' || $3 || '%'
        OR owner.username ILIKE '%' || $3 || '%')
      AND ($4::report_status IS NULL OR r.status = $4::report_status)
      AND ($5::varchar IS NULL OR r.reason_code = $5)
      AND ($6::report_entity_type IS NULL OR r.entity_type = $6::report_entity_type)
      AND ($7::date IS NULL OR r.created_at::date >= $7::date)
      AND ($8::date IS NULL OR r.created_at::date <= $8::date)
      AND ($9::varchar IS NULL OR r.reviewed_by_admin_id = $9 OR r.assigned_admin_id = $9)
      AND ($11::varchar IS NULL OR r.content_owner_id = $11)
      AND ($12::varchar IS NULL OR r.reporter_id = $12)
    ORDER BY
      CASE WHEN $10 = 'severity' THEN COALESCE(rr.severity, 1) END DESC NULLS LAST,
      CASE WHEN $10 = 'oldest' THEN r.created_at END ASC,
      r.created_at DESC
    OFFSET $1 LIMIT $2;
  `,

  fetchReportById: `
    SELECT ${REPORT_COLUMNS},
      p.likes_count AS post_likes_count, p.comments_count AS post_comments_count,
      p.report_count AS post_report_count, c.report_count AS comment_report_count,
      owner.created_at AS owner_created_at, owner.status AS owner_status,
      owner.bio AS owner_bio, owner.deleted_at AS owner_deleted_at,
      reporter.created_at AS reporter_created_at
    ${REPORT_JOINS}
    WHERE r.id = $1;
  `,

  // Other reports on the same content (or user), newest first.
  fetchRelatedReports: `
    SELECT r.id, r.reason, r.reason_code, rr.label AS reason_label, r.status, r.created_at,
      reporter.username AS reporter_username
    FROM reports r
    JOIN users reporter ON reporter.id = r.reporter_id
    LEFT JOIN report_reasons rr ON rr.code = r.reason_code
    WHERE r.entity_type = $1 AND r.entity_id = $2 AND r.id <> $3
    ORDER BY r.created_at DESC
    LIMIT 50;
  `,

  userReportCounts: `
    SELECT
      (SELECT COUNT(*)::int FROM reports WHERE content_owner_id = $1) AS reports_against,
      (SELECT COUNT(*)::int FROM reports WHERE reporter_id = $1) AS reports_submitted,
      (SELECT COUNT(*)::int FROM user_moderation_actions WHERE user_id = $1 AND action IN ('suspend', 'ban')) AS enforcement_actions,
      (SELECT COUNT(*)::int FROM user_warnings WHERE user_id = $1) AS warnings;
  `,

  lockReport: `
    SELECT id, entity_type, entity_id, content_owner_id, status, reason, reason_code
    FROM reports WHERE id = $1 FOR UPDATE;
  `,

  startReview: `
    UPDATE reports
    SET status = 'under_review', assigned_admin_id = $2, review_started_at = NOW()
    WHERE id = $1;
  `,

  // Resolves the report and any other open reports on the same content with one decision.
  // $4 maps the decision onto the app's existing moderator_action enum.
  resolveReports: `
    UPDATE reports
    SET status = 'resolved', decision = $3::report_decision, moderator_action = $4::report_moderator_action,
      account_action = $5, resolution_notes = $6, reviewed_by_admin_id = $7, reviewed_at = NOW(),
      resolved_at = NOW(), assigned_admin_id = COALESCE(assigned_admin_id, $7)
    WHERE id = $1
       OR (entity_type = $8::report_entity_type AND entity_id = $2 AND status <> 'resolved')
    RETURNING id;
  `,

  summary: `
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'under_review')::int AS under_review,
      COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
      COUNT(*) FILTER (WHERE status = 'resolved'
        AND (decision IN ('remove_content', 'account_action') OR moderator_action <> 'no_action'))::int AS actions_taken
    FROM reports
    WHERE ($1::date IS NULL OR created_at::date >= $1::date)
      AND ($2::date IS NULL OR created_at::date <= $2::date);
  `,

  moderators: `
    SELECT DISTINCT a.id, NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), '') AS name, a.email
    FROM admins a
    WHERE a.id IN (
      SELECT reviewed_by_admin_id FROM reports WHERE reviewed_by_admin_id IS NOT NULL
      UNION SELECT assigned_admin_id FROM reports WHERE assigned_admin_id IS NOT NULL
    )
    ORDER BY name;
  `,

  reasons: `
    SELECT code, label, severity FROM report_reasons ORDER BY sort_order;
  `,
};
