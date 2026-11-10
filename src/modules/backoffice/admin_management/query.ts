import { FIND_ADMIN_BY_PHONE_QUERY } from '../shared/lib/contact';

const ROLE_COLUMNS = `
  r.id, r.role, r.description, r.is_active, r.is_system, r.created_at,
  r.created_by, NULLIF(TRIM(CONCAT(c.first_name, ' ', c.last_name)), '') AS created_by_name,
  (SELECT COUNT(*) FROM admins a WHERE a.role_id = r.id AND a.deleted_at IS NULL) AS admin_count,
  (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS permission_count
`;

const STAFF_COLUMNS = `
  a.id, a.first_name, a.last_name, a.email, a.phone_number,
  a.status, a.staff_status, a.avatar, a.role_id, r.role,
  a.is_root_account, a.last_login, a.created_at
`;

export default {
  findRoleByName: `
    SELECT id FROM roles WHERE role = $1 AND is_deleted = FALSE;
  `,

  findRoleByNameExcludingId: `
    SELECT id FROM roles WHERE role = $1 AND id != $2 AND is_deleted = FALSE;
  `,

  createRole: `
    INSERT INTO roles (role, description, created_by)
    VALUES ($1, $2, $3)
    RETURNING id, role, description, is_active, is_system, created_at;
  `,

  countKnownPermissions: `
    SELECT COUNT(*)::int AS count FROM permissions WHERE id IN ($1:csv);
  `,

  attachRolePermissions: `
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT $1, permissions.id
    FROM permissions
    WHERE permissions.id IN ($2:csv)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  `,

  removeRolePermissionsNotIn: `
    DELETE FROM role_permissions
    WHERE role_id = $1 AND permission_id NOT IN ($2:csv);
  `,

  fetchRoles: `
    SELECT ${ROLE_COLUMNS}, COUNT(*) OVER() AS count
    FROM roles r
    LEFT JOIN admins c ON c.id = r.created_by
    WHERE r.is_deleted = FALSE
      AND (r.role ILIKE '%' || $3 || '%' OR $3 = '' OR $3 IS NULL)
      AND ($4::boolean IS NULL OR r.is_active = $4::boolean)
    ORDER BY r.is_system DESC, r.created_at DESC
    OFFSET $1 LIMIT $2;
  `,

  fetchRoleById: `
    SELECT id, role, description, is_active, is_system, created_at
    FROM roles
    WHERE id = $1 AND is_deleted = FALSE;
  `,

  fetchRoleDetailsById: `
    SELECT ${ROLE_COLUMNS}
    FROM roles r
    LEFT JOIN admins c ON c.id = r.created_by
    WHERE r.id = $1 AND r.is_deleted = FALSE;
  `,

  fetchRolePermissions: `
    SELECT p.id, p.category, p.permission, p.description
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role_id = $1
    ORDER BY p.sort_order;
  `,

  editRoleById: `
    UPDATE roles
    SET role = $2, description = $3, updated_at = NOW()
    WHERE id = $1
    RETURNING id, role, description, is_active, is_system, created_at;
  `,

  findRoleAdminCount: `
    SELECT COUNT(*)::int AS count FROM admins WHERE role_id = $1 AND deleted_at IS NULL;
  `,

  deleteRoleById: `
    UPDATE roles SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1;
  `,

  setRoleActiveStatus: `
    UPDATE roles
    SET is_active = $2, updated_at = NOW()
    WHERE id = $1 AND is_deleted = FALSE
    RETURNING id;
  `,

  fetchPermissions: `
    SELECT id, category, permission, description, COUNT(*) OVER() AS count
    FROM permissions
    WHERE (category ILIKE '%' || $3 || '%' OR $3 = '' OR $3 IS NULL)
    ORDER BY sort_order
    OFFSET $1 LIMIT $2;
  `,

  findStaffById: `
    SELECT id, email, first_name, last_name, status, staff_status, role_id, is_root_account
    FROM admins WHERE id = $1 AND deleted_at IS NULL;
  `,

  reassignRole: `
    UPDATE admins
    SET role_id = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, first_name, last_name, role_id;
  `,

  fetchStaff: `
    SELECT ${STAFF_COLUMNS}, COUNT(*) OVER() AS count
    FROM admins a
    LEFT JOIN roles r ON r.id = a.role_id
    WHERE a.deleted_at IS NULL
      AND (
        $3 = '' OR $3 IS NULL
        OR CONCAT(a.first_name, ' ', a.last_name) ILIKE '%' || $3 || '%'
        OR a.email ILIKE '%' || $3 || '%'
      )
      AND ($4::staff_status IS NULL OR a.staff_status = $4::staff_status)
      AND ($5::varchar IS NULL OR a.role_id = $5)
      AND ($6::date IS NULL OR a.created_at::date >= $6::date)
      AND ($7::date IS NULL OR a.created_at::date <= $7::date)
    ORDER BY
      CASE WHEN $8 = 'name_asc' THEN LOWER(CONCAT(a.first_name, ' ', a.last_name)) END ASC,
      CASE WHEN $8 = 'name_desc' THEN LOWER(CONCAT(a.first_name, ' ', a.last_name)) END DESC,
      a.created_at DESC
    OFFSET $1 LIMIT $2;
  `,

  fetchStaffSummary: `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE staff_status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE staff_status = 'suspended')::int AS suspended,
      COUNT(*) FILTER (WHERE staff_status = 'pending_invitation')::int AS pending_invitation
    FROM admins
    WHERE deleted_at IS NULL;
  `,

  fetchStaffDetailsById: `
    SELECT ${STAFF_COLUMNS}
    FROM admins a
    LEFT JOIN roles r ON r.id = a.role_id
    WHERE a.id = $1 AND a.deleted_at IS NULL;
  `,

  findAdminByPhone: FIND_ADMIN_BY_PHONE_QUERY,

  findRoleByIdWithName: `
    SELECT id, role FROM roles WHERE id = $1 AND is_deleted = FALSE;
  `,

  editStaff: `
    UPDATE admins
    SET first_name = $2, last_name = $3, role_id = $4,
      phone_number = CASE WHEN $5::boolean THEN $6 ELSE phone_number END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING id;
  `,

  // Clearing session_id signs the suspended admin out of the portal immediately.
  suspendStaff: `
    UPDATE admins
    SET staff_status = 'suspended', status = 'deactivated', session_id = NULL, updated_at = NOW()
    WHERE id = $1
    RETURNING id;
  `,

  reactivateStaff: `
    UPDATE admins
    SET staff_status = 'active', status = 'active', updated_at = NOW()
    WHERE id = $1
    RETURNING id;
  `,

  createAuditLog: `
    INSERT INTO audit_logs (
      actor_admin_id, action, module, entity_type, entity_reference,
      before_summary, after_summary, origin_application
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Admin Portal');
  `,

  findAdminByEmailIncludingDeleted: `
    SELECT id, email FROM admins WHERE email = $1;
  `,

  inviteStaff: `
    INSERT INTO admins (
      first_name, last_name, email, phone_number, role_id,
      invitation_token, invitation_expires_at, invited_by,
      status, staff_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'inactive', 'pending_invitation')
    RETURNING id;
  `,

  findAdminByInvitationToken: `
    SELECT id, first_name, last_name, email, invitation_token, invitation_expires_at, staff_status
    FROM admins
    WHERE invitation_token = $1 AND deleted_at IS NULL;
  `,

  acceptInvite: `
    UPDATE admins
    SET password = $2, staff_status = 'active', status = 'active',
        invitation_token = NULL, invitation_expires_at = NULL, updated_at = NOW()
    WHERE id = $1
    RETURNING id;
  `,

  findPendingInvite: `
    SELECT a.id, a.first_name, a.email, a.staff_status, a.invitation_expires_at, a.role_id, r.role
    FROM admins a
    LEFT JOIN roles r ON r.id = a.role_id
    WHERE a.id = $1 AND a.deleted_at IS NULL;
  `,

  renewInvitation: `
    UPDATE admins
    SET invitation_token = $2, invitation_expires_at = $3, updated_at = NOW()
    WHERE id = $1;
  `,

  fetchStaffActivity: `
    SELECT
      l.id, l.action, l.module, l.entity_type, l.entity_reference,
      l.before_summary, l.after_summary, l.created_at,
      l.actor_admin_id, NULLIF(TRIM(CONCAT(actor.first_name, ' ', actor.last_name)), '') AS actor_name,
      COALESCE(NULLIF(TRIM(CONCAT(target.first_name, ' ', target.last_name)), ''), target.email::text, target_role.role::text) AS target_name,
      COUNT(*) OVER() AS count
    FROM audit_logs l
    LEFT JOIN admins actor ON actor.id = l.actor_admin_id
    LEFT JOIN admins target ON l.entity_type = 'admin' AND target.id = l.entity_reference
    LEFT JOIN roles target_role ON l.entity_type = 'role' AND target_role.id = l.entity_reference
    WHERE l.entity_type = 'admin' AND l.entity_reference = $3
    ORDER BY l.created_at DESC
    OFFSET $1 LIMIT $2;
  `,
};
