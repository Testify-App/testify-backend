// Posts and comments hidden by moderation ($3 type: post | comment).
export default {
  // $1 offset, $2 limit, $3 type, $4 search, $5 from, $6 to
  fetchHidden: `
    SELECT h.*, COUNT(*) OVER() AS count FROM (
      SELECT 'post' AS type, p.id, p.id AS post_id, p.content, p.media_attachments AS media,
        p.created_at AS posted_at, p.hidden_at, p.hidden_reason, p.hidden_report_id,
        u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name,
        u.avatar AS author_avatar,
        a.id AS hidden_by_id, NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), '') AS hidden_by_name,
        NULL::text AS parent_post_content
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN admins a ON a.id = p.hidden_by_admin_id
      WHERE p.hidden_at IS NOT NULL AND $3 = 'post'
      UNION ALL
      SELECT 'comment', c.id, c.post_id, c.content, c.media_attachments,
        c.created_at, c.hidden_at, c.hidden_reason, c.hidden_report_id,
        u.id, u.username, u.display_name, u.avatar,
        a.id, NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''),
        pp.content
      FROM comments c
      JOIN users u ON u.id = c.user_id
      LEFT JOIN admins a ON a.id = c.hidden_by_admin_id
      LEFT JOIN posts pp ON pp.id = c.post_id
      WHERE c.hidden_at IS NOT NULL AND $3 = 'comment'
    ) h
    WHERE ($4 = '' OR $4 IS NULL
        OR h.id ILIKE $4 || '%'
        OR h.content ILIKE '%' || $4 || '%'
        OR h.author_username ILIKE '%' || $4 || '%')
      AND ($5::date IS NULL OR h.hidden_at::date >= $5::date)
      AND ($6::date IS NULL OR h.hidden_at::date <= $6::date)
    ORDER BY h.hidden_at DESC
    OFFSET $1 LIMIT $2;
  `,

  counts: `
    SELECT
      (SELECT COUNT(*)::int FROM posts WHERE hidden_at IS NOT NULL) AS posts,
      (SELECT COUNT(*)::int FROM comments WHERE hidden_at IS NOT NULL) AS comments;
  `,
};
