/** Readable names for audit_logs.action values, used by the Audit Log page and its filters. */
export const ACTION_LABELS: Record<string, string> = {
  'report:start_review': 'Report review started',
  'report:resolve': 'Report resolved',
  'post:hide': 'Post removed',
  'comment:hide': 'Comment removed',
  'post:restore': 'Post restored',
  'comment:restore': 'Comment restored',
  'user:suspend': 'User suspended',
  'user:extend': 'Suspension changed',
  'user:ban': 'User banned',
  'user:reinstate': 'User reinstated',
  'user:auto_reinstate': 'Suspension expired',
  'user:warn': 'Warning sent',
  'user:note_add': 'Note added',
  'user:note_edit': 'Note edited',
  'user:note_delete': 'Note deleted',
  'user:view_profile': 'Profile viewed',
  'auth:login': 'Signed in',
  'auth:logout': 'Signed out',
  'auth:password_changed': 'Password changed',
  'auth:password_reset': 'Password reset',
  'profile:update': 'Profile updated',
  'role:create': 'Role created',
  'role:update': 'Role updated',
  'role:delete': 'Role deleted',
  'role:activate': 'Role activated',
  'role:deactivate': 'Role deactivated',
  'admin:update': 'Staff details updated',
  'admin:suspend': 'Staff suspended',
  'admin:reactivate': 'Staff reactivated',
  'admin:reassign_role': 'Staff role changed',
  'staff:invite': 'Staff invited',
  'staff:bulk_invite': 'Staff invited (bulk)',
  'staff:resend_invite': 'Invitation resent',
  'staff:accept_invite': 'Invitation accepted',
};

export const actionLabel = (action: string) => ACTION_LABELS[action] ?? action;

/** Audit modules grouped for the page's category filter. */
export const CATEGORY_MODULES: Record<string, string[]> = {
  moderation: ['moderation', 'users', 'hidden_content'],
  admin: ['authentication', 'roles_and_permissions', 'staff_management'],
  views: ['user_views'],
};
