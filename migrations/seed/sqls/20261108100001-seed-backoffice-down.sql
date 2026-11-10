-- Removes the Super Admin role and the permission catalogue.
DELETE FROM role_permissions WHERE role_id = 'role-super-admin';
DELETE FROM roles WHERE id = 'role-super-admin';
DELETE FROM permissions WHERE id IN (
  'overview:view',
  'overview:export',
  'moderation:view',
  'moderation:update',
  'moderation:export',
  'reports:view',
  'reports:export',
  'users:view',
  'users:update',
  'users:delete',
  'users:export',
  'users:ban',
  'users:warn',
  'audit:view',
  'audit:export',
  'hidden:view',
  'hidden:update',
  'roles:create',
  'roles:view',
  'roles:update',
  'roles:delete',
  'staff:create',
  'staff:view',
  'staff:update',
  'staff:export',
  'settings:view',
  'settings:update'
);
