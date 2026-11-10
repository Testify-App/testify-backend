-- Seed data for the admin portal: the permission catalogue (one row per sidebar module and
-- action) and the built-in Super Admin role holding every permission. Tables come from the
-- migration 20261111120000-add-backoffice-admin-and-moderation.
--
-- No admin account is seeded (this repository is public, so a seeded password would be public
-- too). Create the first admin with
-- `npm run backoffice:create-admin -- --email <email> --password <password>`.
--
-- Idempotent: safe to re-run.

INSERT INTO permissions (id, category, permission, description, sort_order)
VALUES
  ('overview:view', 'Overview', 'overview:view', 'View the overview dashboard', 10),
  ('overview:export', 'Overview', 'overview:export', 'Export overview data', 11),

  ('moderation:view', 'Moderation Queue', 'moderation:view', 'View the moderation queue', 20),
  ('moderation:update', 'Moderation Queue', 'moderation:update', 'Act on reported content', 21),
  ('moderation:export', 'Moderation Queue', 'moderation:export', 'Export moderation reports', 22),

  ('reports:view', 'Reports', 'reports:view', 'View reports', 30),
  ('reports:export', 'Reports', 'reports:export', 'Export reports', 31),

  ('users:view', 'Users', 'users:view', 'View app users', 40),
  ('users:update', 'Users', 'users:update', 'Update app users', 41),
  ('users:delete', 'Users', 'users:delete', 'Delete app users', 42),
  ('users:export', 'Users', 'users:export', 'Export app users', 43),
  ('users:ban', 'Users', 'users:ban', 'Permanently ban app users', 44),
  ('users:warn', 'Users', 'users:warn', 'Send formal warnings to app users', 45),

  ('audit:view', 'Audit Log', 'audit:view', 'View the audit log', 50),
  ('audit:export', 'Audit Log', 'audit:export', 'Export the audit log', 51),

  ('hidden:view', 'Hidden Content', 'hidden:view', 'View hidden content', 60),
  ('hidden:update', 'Hidden Content', 'hidden:update', 'Restore or remove hidden content', 61),

  ('roles:create', 'Roles & Permissions', 'roles:create', 'Create roles', 70),
  ('roles:view', 'Roles & Permissions', 'roles:view', 'View roles and permissions', 71),
  ('roles:update', 'Roles & Permissions', 'roles:update', 'Edit roles and assign them', 72),
  ('roles:delete', 'Roles & Permissions', 'roles:delete', 'Delete roles', 73),

  ('staff:create', 'Staff Management', 'staff:create', 'Invite staff', 80),
  ('staff:view', 'Staff Management', 'staff:view', 'View staff', 81),
  ('staff:update', 'Staff Management', 'staff:update', 'Edit, suspend and reactivate staff', 82),
  ('staff:export', 'Staff Management', 'staff:export', 'Export the staff list', 83),

  ('settings:view', 'Settings', 'settings:view', 'View settings', 90),
  ('settings:update', 'Settings', 'settings:update', 'Change settings', 91)
ON CONFLICT (id) DO NOTHING;


-- Built-in Super Admin role (is_system: it cannot be edited, deactivated or deleted from the
-- portal) holding every permission.
INSERT INTO roles (id, role, description, is_system)
VALUES
  ('role-super-admin', 'Super Admin', 'Full access to every part of the Testify admin portal.', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-super-admin', p.id
FROM permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;
