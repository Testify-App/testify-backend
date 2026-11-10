/**
 * Creates (or resets) the root admin for the Testify admin portal. The root account holds the
 * built-in Super Admin role, every permission, and cannot be suspended from the portal.
 *
 *   npm run backoffice:create-admin -- --email admin@testify.app --password 'Secret123' \
 *     --first-name Testify --last-name Admin
 *
 * Re-running with an existing email resets that admin's password and reactivates the account.
 */
import { db } from '../src/config/database';
import hashingService from '../src/shared/services/hashing';
import { passwordSchema } from '../src/modules/backoffice/authentication/validator';
import { titleCaseName } from '../src/modules/backoffice/shared/lib/contact';

const arg = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const main = async () => {
  const email = arg('email')?.trim().toLowerCase();
  const password = arg('password');
  const firstName = titleCaseName(arg('first-name') ?? 'Testify');
  const lastName = titleCaseName(arg('last-name') ?? 'Admin');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
    throw new Error('Usage: --email <email> --password <password> [--first-name <name>] [--last-name <name>]');
  }
  const { error } = passwordSchema.extract('password').label('Password').validate(password);
  if (error) throw new Error(error.details[0].message.replace(/"/g, ''));

  // The admin is created holding the built-in Super Admin role, so the tables (migration) and the
  // role (seed) must already exist. Say which step is missing rather than surfacing a raw
  // database error.
  const { admins_table: adminsTable } = await db.one(
    "SELECT to_regclass('public.admins') IS NOT NULL AS admins_table;",
  );
  if (!adminsTable) {
    throw new Error('The admin tables do not exist yet. Run `npm run migrate:up` first, then `npm run seed:up`.');
  }
  const role = await db.oneOrNone(
    "SELECT id FROM roles WHERE id = 'role-super-admin' AND is_deleted = FALSE;",
  );
  if (!role) {
    throw new Error('The Super Admin role does not exist yet. Run `npm run seed:up` first, then try again.');
  }

  const hashed = await hashingService.hash(password);
  const admin = await db.one(
    `INSERT INTO admins (
       email, password, first_name, last_name, role_id, is_root_account, status, staff_status
     ) VALUES ($1, $2, $3, $4, 'role-super-admin', TRUE, 'active', 'active')
     ON CONFLICT (email) DO UPDATE SET
       password = EXCLUDED.password, role_id = 'role-super-admin', is_root_account = TRUE,
       status = 'active', staff_status = 'active', failed_login_attempts = 0, locked_at = NULL,
       invitation_token = NULL, invitation_expires_at = NULL, deleted_at = NULL, updated_at = NOW()
     RETURNING id, (xmax = 0) AS created;`,
    [email, hashed, firstName, lastName],
  );
  console.log(`${admin.created ? 'Created' : 'Updated'} root admin ${email} (${admin.id}).`);
};

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  })
  .finally(() => db.$pool.end());
