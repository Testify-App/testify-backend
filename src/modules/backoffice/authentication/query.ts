import { FIND_ADMIN_BY_PHONE_QUERY } from '../shared/lib/contact';

export default {
  findAdminByEmail: `
    SELECT id, first_name, last_name, email, password, status,
      staff_status, avatar, role_id, is_root_account,
      failed_login_attempts, locked_at
    FROM admins
    WHERE email = $1 AND deleted_at IS NULL;
  `,

  findAdminById: `
    SELECT id, first_name, last_name, email, password, status,
      staff_status, avatar, role_id, is_root_account,
      failed_login_attempts, locked_at, otp, otp_expiry_time
    FROM admins
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  incrementFailedLoginAttempts: `
    UPDATE admins
    SET failed_login_attempts = failed_login_attempts + 1,
      locked_at = CASE WHEN failed_login_attempts + 1 >= 5 THEN NOW() ELSE locked_at END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING failed_login_attempts, locked_at;
  `,

  resetFailedLoginAttempts: `
    UPDATE admins
    SET failed_login_attempts = 0, locked_at = NULL, updated_at = NOW()
    WHERE id = $1;
  `,

  setLoginOTP: `
    UPDATE admins
    SET otp = $2, otp_expiry_time = $3, updated_at = NOW()
    WHERE id = $1;
  `,

  clearLoginOTP: `
    UPDATE admins
    SET otp = NULL, otp_expiry_time = NULL, updated_at = NOW()
    WHERE id = $1;
  `,

  completeLogin: `
    UPDATE admins
    SET session_id = $2, last_login = NOW(), last_activity_at = NOW(), updated_at = NOW()
    WHERE id = $1
    RETURNING id, first_name, last_name, email, status, staff_status,
      avatar, role_id, is_root_account, session_id, last_login;
  `,

  setForgotPasswordOTP: `
    UPDATE admins
    SET verification_code = $2, verification_code_expiry_time = $3, updated_at = NOW()
    WHERE id = $1;
  `,

  findForgotPasswordOTP: `
    SELECT id, verification_code, verification_code_expiry_time
    FROM admins
    WHERE id = $1;
  `,

  clearForgotPasswordOTP: `
    UPDATE admins
    SET verification_code = NULL, verification_code_expiry_time = NULL, updated_at = NOW()
    WHERE id = $1;
  `,

  // Also ends the portal session and clears any lockout, since the admin proved control of the mailbox.
  resetPassword: `
    UPDATE admins
    SET password = $2, session_id = NULL, failed_login_attempts = 0, locked_at = NULL, updated_at = NOW()
    WHERE email = $1 AND deleted_at IS NULL
    RETURNING id;
  `,

  fetchProfile: `
    SELECT a.id, a.first_name, a.last_name, a.email, a.phone_number, a.avatar,
      a.is_root_account, a.last_login, a.role_id, r.role AS role_name,
      r.is_active AS role_is_active, r.is_system AS role_is_system
    FROM admins a
    LEFT JOIN roles r ON r.id = a.role_id AND r.is_deleted = FALSE
    WHERE a.id = $1 AND a.deleted_at IS NULL;
  `,

  endSession: `
    UPDATE admins
    SET session_id = NULL, updated_at = NOW()
    WHERE id = $1 AND session_id = $2;
  `,

  findAdminForSelfUpdate: `
    SELECT id, first_name, last_name, phone_number, password
    FROM admins
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  findAdminByPhone: FIND_ADMIN_BY_PHONE_QUERY,

  updateProfile: `
    UPDATE admins
    SET first_name = $2, last_name = $3,
      phone_number = CASE WHEN $4::boolean THEN $5 ELSE phone_number END,
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  // Keeps admins.session_id (the portal session making this request) valid.
  changePassword: `
    UPDATE admins
    SET password = $2, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  createAuditLog: `
    INSERT INTO audit_logs (
      actor_admin_id, action, module, entity_type, entity_reference,
      before_summary, after_summary, origin_application
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Admin Portal');
  `,
};
