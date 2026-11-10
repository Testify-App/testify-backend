const COLUMNS = `
  l.id, l.action, l.module, l.entity_type, l.entity_reference, l.before_summary, l.after_summary,
  l.origin_ip, l.created_at, l.actor_admin_id,
  NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), '') AS actor_name, a.email AS actor_email,
  CASE l.entity_type
    WHEN 'user' THEN tu.username
    WHEN 'admin' THEN COALESCE(NULLIF(TRIM(CONCAT(ta.first_name, ' ', ta.last_name)), ''), ta.email::text)
    WHEN 'role' THEN tr.role::text
    ELSE NULL
  END AS target_name
`;

const JOINS = `
  FROM audit_logs l
  LEFT JOIN admins a ON a.id = l.actor_admin_id
  LEFT JOIN users tu ON l.entity_type = 'user' AND tu.id = l.entity_reference
  LEFT JOIN admins ta ON l.entity_type = 'admin' AND ta.id = l.entity_reference
  LEFT JOIN roles tr ON l.entity_type = 'role' AND tr.id = l.entity_reference
`;

// $3 search, $4 action, $5 actor id, $6 entity type, $7 modules (array or null), $8 from, $9 to
const WHERE = `
  WHERE ($3 = '' OR $3 IS NULL
      OR l.entity_reference ILIKE $3 || '%'
      OR tu.username ILIKE '%' || $3 || '%'
      OR CONCAT(a.first_name, ' ', a.last_name) ILIKE '%' || $3 || '%'
      OR a.email ILIKE '%' || $3 || '%')
    AND ($4::varchar IS NULL OR l.action = $4)
    AND ($5::varchar IS NULL OR l.actor_admin_id = $5)
    AND ($6::varchar IS NULL OR l.entity_type = $6)
    AND ($7::varchar[] IS NULL OR l.module = ANY($7::varchar[]))
    AND ($8::date IS NULL OR l.created_at::date >= $8::date)
    AND ($9::date IS NULL OR l.created_at::date <= $9::date)
`;

export default {
  fetchLogs: `
    SELECT ${COLUMNS}, COUNT(*) OVER() AS count
    ${JOINS}
    ${WHERE}
    ORDER BY l.created_at DESC
    OFFSET $1 LIMIT $2;
  `,

  actions: `
    SELECT DISTINCT action FROM audit_logs ORDER BY action;
  `,

  actors: `
    SELECT DISTINCT a.id, NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), '') AS name, a.email
    FROM audit_logs l JOIN admins a ON a.id = l.actor_admin_id
    ORDER BY name;
  `,
};
