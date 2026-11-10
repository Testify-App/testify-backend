import { db } from '../../../../config/database';

// Effective permissions are the admin's role permissions; the root account holds every permission.
// Shared by `permissionAccessValidator` and `GET /auth/me` so the API and the portal never disagree.
export const fetchEffectivePermissionKeys = async (
  roleId: string | null | undefined,
  isRootAccount: boolean | undefined,
): Promise<string[]> => {
  const rows = isRootAccount
    ? await db.manyOrNone('SELECT permission FROM permissions ORDER BY sort_order;')
    : await db.manyOrNone(
      `SELECT p.permission FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.sort_order;`,
      [roleId ?? null],
    );
  return rows.map((row) => row.permission as string);
};

export const adminHasPermission = async (
  roleId: string | null | undefined,
  permission: string,
): Promise<boolean> => {
  if (!roleId) return false;
  const row = await db.one(
    `SELECT EXISTS (
       SELECT 1 FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND p.permission = $2
     ) AS allowed;`,
    [roleId, permission],
  );
  return row.allowed;
};
