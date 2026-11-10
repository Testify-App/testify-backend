-- Reverses 20261111120000-add-backoffice-admin-and-moderation (moderation first, then the tables). The seed data is removed
-- with them; `npm run seed:down` removes it on its own.

ALTER TABLE audit_logs DROP COLUMN IF EXISTS origin_ip;
DROP TABLE IF EXISTS user_notes;
DROP TABLE IF EXISTS user_warnings;
DROP TABLE IF EXISTS user_moderation_actions;
ALTER TABLE users
  DROP COLUMN IF EXISTS moderation_status,
  DROP COLUMN IF EXISTS suspended_until,
  DROP COLUMN IF EXISTS moderation_updated_at;
DROP TYPE IF EXISTS user_moderation_status;
ALTER TABLE comments
  DROP COLUMN IF EXISTS hidden_at,
  DROP COLUMN IF EXISTS hidden_by_admin_id,
  DROP COLUMN IF EXISTS hidden_reason,
  DROP COLUMN IF EXISTS hidden_report_id,
  DROP COLUMN IF EXISTS report_count;
ALTER TABLE posts
  DROP COLUMN IF EXISTS hidden_at,
  DROP COLUMN IF EXISTS hidden_by_admin_id,
  DROP COLUMN IF EXISTS hidden_reason,
  DROP COLUMN IF EXISTS hidden_report_id;
ALTER TABLE reports
  DROP COLUMN IF EXISTS reason_code,
  DROP COLUMN IF EXISTS assigned_admin_id,
  DROP COLUMN IF EXISTS reviewed_by_admin_id,
  DROP COLUMN IF EXISTS decision,
  DROP COLUMN IF EXISTS account_action,
  DROP COLUMN IF EXISTS resolution_notes,
  DROP COLUMN IF EXISTS review_started_at,
  DROP COLUMN IF EXISTS resolved_at;
DROP TYPE IF EXISTS report_decision;
DROP FUNCTION IF EXISTS resolve_report_reason_code(TEXT);
DROP TABLE IF EXISTS report_reasons;


DROP TABLE IF EXISTS audit_logs;
ALTER TABLE IF EXISTS roles DROP COLUMN IF EXISTS created_by;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TYPE IF EXISTS staff_status;
