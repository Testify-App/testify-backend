export default {
  register: `
    INSERT INTO users (
      email,
      password,
      dob,
      username,
      avatar,
      terms_and_condition
    ) VALUES (
      $1, $2, $3, $4, $5, $6
    )
    RETURNING id;
  `,

  activateRegistration: `
    UPDATE users
      SET
        status = 'active',
        activated_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, password, status;
  `,

  backofficeVerificationCode: `
    UPDATE admins
      SET
        verification_code = $2,
        verification_code_expiry_time = $3,
        updated_at = NOW()
    WHERE id = $1;
  `,

  validateBackofficeVerificationCode: `
    SELECT
      id,
      verification_code,
      verification_code_expiry_time 
    FROM admins
    WHERE id = $1;
  `,

  clearBackofficeVerificationCode: `
    UPDATE admins
    SET
      verification_code = NULL,
      verification_code_expiry_time = NULL,
      updated_at = NOW()
    WHERE id = $1
  `,

  customerVerificationCode: `
    UPDATE users
      SET
        verification_code = $2,
        verification_code_expiry_time = $3,
        updated_at = NOW()
    WHERE id = $1;
  `,

  validateCustomerVerificationCode: `
    SELECT
      id,
      verification_code,
      verification_code_expiry_time 
    FROM users
    WHERE id = $1;
  `,

  clearCustomerVerificationCode: `
    UPDATE users
    SET
      verification_code = NULL,
      verification_code_expiry_time = NULL,
      updated_at = NOW()
    WHERE id = $1
  `,

  resetPassword: `
    UPDATE users
    SET
      password = $2,
      password_changed_count = password_changed_count + 1,
      hash_id_key = NULL,
      updated_at = NOW()
    WHERE id = $1;
  `,

  login: `
    SELECT
      id,
      email,
      username,
      password,
      status
    FROM users
    WHERE email = $1 AND deleted_at IS NULL;
  `,

  setBackofficeLastLoginTime: `
    UPDATE admins
    SET
      session_id = $2,
      last_login = NOW()
    WHERE id = $1;
  `,

  setUserLastLoginTime: `
    UPDATE users
    SET
      session_id = $2,
      last_login = NOW()
    WHERE id = $1;
  `,

  saveFcmToken: `
    UPDATE users
    SET fcm_token = $2, updated_at = NOW()
    WHERE id = $1;
  `,

  getPasswordById: `
    SELECT id, password FROM users WHERE id = $1 AND deleted_at IS NULL;
  `,

  getUserByEmailForActivation: `
    SELECT id, activated_at FROM users WHERE email = $1 AND deleted_at IS NULL;
  `,

  changePassword: `
    UPDATE users
    SET
      password = $2,
      password_changed_count = password_changed_count + 1,
      session_id = NULL,
      updated_at = NOW()
    WHERE id = $1;
  `,

  deactivateAccount: `
    UPDATE users
    SET status = 'deactivated', session_id = NULL, updated_at = NOW()
    WHERE id = $1;
  `,

  deleteAccount: `
    UPDATE users
    SET deleted_at = NOW(), status = 'deactivated', session_id = NULL, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL;
  `,
};
