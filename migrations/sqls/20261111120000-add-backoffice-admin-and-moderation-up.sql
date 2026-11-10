-- Admin portal (backoffice) schema, in one migration:
--   1. Admins, roles, permissions and the audit log
--   2. Moderation: report reasons and decisions, hidden content, account standing,
--      moderation history, warnings and internal notes
--
-- Tables only. The permission catalogue and the built-in Super Admin role are seed data:
-- migrations/seed/20261108100001-seed-backoffice (run `npm run seed:up`). The report reasons
-- stay here because this migration backfills every existing report's reason_code from them.
--
-- Every statement is idempotent, so this is safe on databases that already ran the earlier,
-- separate backoffice migrations.


-- ============================================================================================
-- 1. Admins, roles, permissions and the audit log
-- ============================================================================================

-- ============================================================
-- Backoffice RBAC: roles, permissions, role_permissions, admins, audit_logs
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_status') THEN
    CREATE TYPE staff_status AS ENUM ('pending_invitation', 'active', 'suspended');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR PRIMARY KEY DEFAULT 'role-' || LOWER(REPLACE(CAST(uuid_generate_v4() AS VARCHAR(50)), '-', '')),
  role CITEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  -- System roles (Super Admin) are managed by the platform: they cannot be edited, deactivated or deleted.
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_role ON roles(role) WHERE is_deleted = FALSE;

-- The id is the permission key (e.g. 'roles:create') so the portal can address permissions directly.
-- Rows come from the seed migrations/seed/sqls/20261108100001-seed-backoffice-up.sql.
CREATE TABLE IF NOT EXISTS permissions (
  id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  permission VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id VARCHAR PRIMARY KEY DEFAULT 'role-perm-' || LOWER(REPLACE(CAST(uuid_generate_v4() AS VARCHAR(50)), '-', '')),
  role_id VARCHAR NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id VARCHAR NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  first_name CITEXT NULL,
  last_name CITEXT NULL,
  email CITEXT UNIQUE NOT NULL,
  password VARCHAR(255) NULL,
  phone_number VARCHAR UNIQUE NULL,
  status status DEFAULT 'inactive',
  staff_status staff_status DEFAULT 'pending_invitation',
  avatar TEXT NULL,
  role_id VARCHAR NULL REFERENCES roles(id) ON DELETE SET NULL,
  is_root_account BOOLEAN NOT NULL DEFAULT FALSE,
  -- Login OTP + lockout
  otp VARCHAR NULL,
  otp_expiry_time TIMESTAMPTZ NULL,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ NULL,
  -- Invitation flow
  invitation_token VARCHAR NULL,
  invitation_expires_at TIMESTAMPTZ NULL,
  invited_by VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  -- Password reset
  verification_code VARCHAR NULL,
  verification_code_expiry_time TIMESTAMPTZ NULL,
  -- One portal session per admin; refreshed on authenticated requests for the idle timeout.
  session_id VARCHAR NULL,
  last_login TIMESTAMPTZ NULL,
  last_activity_at TIMESTAMPTZ NULL,
  deleted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL
);

-- Who created each role (NULL for seeded/system roles). Added here because roles is created before admins.
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);
CREATE INDEX IF NOT EXISTS idx_admins_invitation_token ON admins(invitation_token);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR NOT NULL,
  module VARCHAR NOT NULL,
  entity_type VARCHAR NULL,
  entity_reference VARCHAR NULL,
  before_summary JSONB NULL,
  after_summary JSONB NULL,
  origin_application VARCHAR NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_admin_id ON audit_logs(actor_admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_reference ON audit_logs(entity_type, entity_reference);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================================
-- 2. Moderation
-- ============================================================================================

-- Groundwork for the admin portal's moderation modules (Moderation, Users, Hidden Content,
-- Audit Log). Every statement is idempotent so the migration is safe to re-run.

-- ---------------------------------------------------------------------------
-- Report reasons: the fixed list the mobile app offers (lib/app/utils/report_reasons.dart),
-- each with a severity used to sort the moderation queue (3 = most severe).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_reasons (
  code        VARCHAR PRIMARY KEY,
  label       VARCHAR NOT NULL UNIQUE,
  severity    SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 3),
  sort_order  INTEGER NOT NULL
);

INSERT INTO report_reasons (code, label, severity, sort_order) VALUES
  ('spam', 'Spam', 1, 10),
  ('misleading', 'False or misleading information', 2, 20),
  ('harassment', 'Harassment or bullying', 3, 30),
  ('hate_speech', 'Hate speech or hateful conduct', 3, 40),
  ('violence', 'Violence, threats or dangerous organizations', 3, 50),
  ('self_harm', 'Suicide, self-harm or dangerous behaviour', 3, 60),
  ('nudity', 'Nudity or sexual content', 3, 70),
  ('fraud', 'Fraud or scams', 2, 80),
  ('impersonation', 'Impersonation or fake account', 2, 90),
  ('intellectual_property', 'Intellectual property infringement', 2, 100),
  ('other', 'Other', 1, 110)
ON CONFLICT (code) DO NOTHING;

-- Maps the free-text reason stored on a report to a reason code. Matches the app's labels
-- exactly (case-insensitive), plus the short names used by older clients; anything else is
-- 'other'. Used by the backfill below and by POST /reports.
CREATE OR REPLACE FUNCTION resolve_report_reason_code(reason TEXT) RETURNS VARCHAR AS $$
  SELECT COALESCE(
    (SELECT code FROM report_reasons WHERE lower(label) = lower(trim(reason))),
    CASE lower(trim(reason))
      WHEN 'spam' THEN 'spam'
      WHEN 'misleading content' THEN 'misleading'
      WHEN 'harassment' THEN 'harassment'
      WHEN 'hate speech' THEN 'hate_speech'
      WHEN 'inappropriate content' THEN 'nudity'
      ELSE 'other'
    END
  );
$$ LANGUAGE SQL STABLE;

-- ---------------------------------------------------------------------------
-- Reports: decisions taken by portal admins (the `admins` table, not app users).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_decision') THEN
    CREATE TYPE report_decision AS ENUM ('no_action', 'remove_content', 'account_action');
  END IF;
END
$$;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS reason_code VARCHAR NULL REFERENCES report_reasons(code),
  ADD COLUMN IF NOT EXISTS assigned_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_by_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS decision report_decision NULL,
  ADD COLUMN IF NOT EXISTS account_action VARCHAR NULL,
  ADD COLUMN IF NOT EXISTS resolution_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS review_started_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ NULL;

UPDATE reports SET reason_code = resolve_report_reason_code(reason) WHERE reason_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reason_code ON reports(reason_code);
CREATE INDEX IF NOT EXISTS idx_reports_reviewed_by_admin ON reports(reviewed_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- Comments get a report counter like posts (POST /reports now maintains both).
ALTER TABLE comments ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;
UPDATE comments c SET report_count = r.count
FROM (SELECT entity_id, COUNT(*)::int AS count FROM reports WHERE entity_type = 'comment' GROUP BY entity_id) r
WHERE r.entity_id = c.id AND c.report_count = 0;

-- ---------------------------------------------------------------------------
-- Hidden by moderation. Hiding also sets deleted_at, so every existing feed and detail query
-- (which filter on deleted_at) excludes the content without changes. Restoring only touches
-- rows with hidden_at set, so an author's own deletion can never be undone from the portal.
-- ---------------------------------------------------------------------------
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS hidden_by_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS hidden_report_id VARCHAR NULL;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS hidden_by_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS hidden_report_id VARCHAR NULL;

CREATE INDEX IF NOT EXISTS idx_posts_hidden_at ON posts(hidden_at DESC) WHERE hidden_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_hidden_at ON comments(hidden_at DESC) WHERE hidden_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Account standing, separate from users.status (which tracks the account lifecycle and the
-- user's own deactivation). A suspension with suspended_until in the past is already lifted.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_moderation_status') THEN
    CREATE TYPE user_moderation_status AS ENUM ('active', 'suspended', 'banned');
  END IF;
END
$$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS moderation_status user_moderation_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS moderation_updated_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_moderation_status ON users(moderation_status) WHERE moderation_status <> 'active';

-- Enforcement history: suspend, ban, reinstate, extend (and automatic expiry).
CREATE TABLE IF NOT EXISTS user_moderation_actions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action                VARCHAR NOT NULL CHECK (action IN ('suspend', 'ban', 'reinstate', 'extend', 'expire')),
  reason_code           VARCHAR NULL,
  reason                TEXT NULL,
  note                  TEXT NULL,
  duration_days         INTEGER NULL,
  starts_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at               TIMESTAMPTZ NULL,
  performed_by_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  report_id             VARCHAR NULL,
  notified              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_user ON user_moderation_actions(user_id, created_at DESC);

-- Formal warnings, with the user's acknowledgement.
CREATE TABLE IF NOT EXISTS user_warnings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_key     VARCHAR NULL,
  message          TEXT NOT NULL,
  sent_by_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  report_id        VARCHAR NULL,
  notification_id  VARCHAR NULL,
  emailed          BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at  TIMESTAMPTZ NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON user_warnings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_warnings_pending ON user_warnings(user_id) WHERE acknowledged_at IS NULL;

-- Internal moderator notes; never exposed to app users.
CREATE TABLE IF NOT EXISTS user_notes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_admin_id VARCHAR NULL REFERENCES admins(id) ON DELETE SET NULL,
  body           TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  tag            VARCHAR NULL CHECK (tag IN ('warning', 'positive', 'neutral', 'pending_review')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NULL,
  deleted_at     TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user ON user_notes(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_notes_tag ON user_notes(tag) WHERE deleted_at IS NULL;

-- Where an admin action came from (Express trusts one proxy hop: CloudFront).
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS origin_ip VARCHAR NULL;
