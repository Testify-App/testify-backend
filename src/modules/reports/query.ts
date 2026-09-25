export default {
  getPostOwner: `
    SELECT user_id FROM posts WHERE id = $1 AND deleted_at IS NULL;
  `,

  getCommentOwner: `
    SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL;
  `,

  createReport: `
    INSERT INTO reports (entity_type, entity_id, content_owner_id, reporter_id, reason, details)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (entity_type, entity_id, reporter_id) DO NOTHING
    RETURNING *;
  `,

  getReports: `
    SELECT COUNT(*) OVER () as count,
      r.*,
      reporter.username  AS reporter_username,
      reporter.avatar    AS reporter_avatar,
      owner.username     AS content_owner_username,
      owner.avatar       AS content_owner_avatar,
      post.id                 AS post_id,
      post.content            AS post_content,
      post.media_attachments  AS post_media_attachments,
      post.created_at         AS post_created_at,
      comment.id              AS comment_id,
      comment.content         AS comment_content,
      comment.media_attachments AS comment_media_attachments,
      comment.created_at      AS comment_created_at
    FROM reports r
    JOIN users reporter ON r.reporter_id = reporter.id
    JOIN users owner ON r.content_owner_id = owner.id
    LEFT JOIN posts post ON r.entity_type = 'post' AND post.id = r.entity_id
    LEFT JOIN comments comment ON r.entity_type = 'comment' AND comment.id = r.entity_id
    WHERE ($3::report_status IS NULL OR r.status = $3)
      AND ($4::report_entity_type IS NULL OR r.entity_type = $4)
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  updateReportStatus: `
    UPDATE reports
    SET status = $2, moderator_action = COALESCE($3, moderator_action), reviewed_by = $4, reviewed_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,
};
