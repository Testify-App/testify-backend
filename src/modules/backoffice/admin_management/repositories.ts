import crypto from 'crypto';
import { ITask } from 'pg-promise';
import * as dtos from './dto';
import * as entities from './entities';
import { AdminManagementInterface } from './interface';
import {
  BadException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';
import {
  INVALID_PHONE_MESSAGE,
  PHONE_IN_USE_MESSAGE,
  isPhoneUniqueViolation,
  normalisePhoneNumber,
  titleCaseName,
} from '../shared/lib/contact';
import { db } from '../../../config/database';
import AdminManagementQuery from './query';
import { fetchResourceByPage } from '../../../shared/helpers';

type Queryable = typeof db | ITask<any>;

export const INVITE_TOKEN_TTL_HOURS = 72;
const INVITE_RESEND_COOLDOWN_SECONDS = 60;
export const SELF_ROLE_CHANGE_MESSAGE = 'You cannot change your own role.';
export const SYSTEM_ROLE_MESSAGE = 'The Super Admin role is managed by the system and cannot be changed.';
const ROOT_ACCOUNT_MESSAGE = 'The root account cannot be suspended or moved to another role.';

const STAFF_STATUS_FILTER: Record<string, string> = {
  active: 'active',
  suspended: 'suspended',
  pending_invitation: 'pending_invitation',
};

const withCreator = (row: any) => {
  const { created_by, created_by_name, count, ...role } = row;
  return { ...role, created_by: created_by ? { id: created_by, name: created_by_name ?? '' } : null };
};

const toRole = (row: any, permissions?: entities.PermissionEntity[]) => new entities.RoleEntity({
  ...withCreator(row),
  admin_count: Number(row.admin_count ?? 0),
  permission_count: permissions ? permissions.length : Number(row.permission_count ?? 0),
  ...(permissions ? { permissions } : {}),
});

const toStaff = ({ count, ...row }: any) => new entities.StaffEntity({ ...row });

const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

const generateInviteToken = (): { token: string; hashed: string; expiresAt: Date } => {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hashed: hashToken(token),
    expiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_HOURS * 60 * 60 * 1000),
  };
};

// Throws ConflictException when another live admin already holds this (normalised) phone number.
const assertPhoneAvailable = async (t: Queryable, phone: string | null | undefined, excludeAdminId: string | null) => {
  if (!phone) return;
  const holder = await t.oneOrNone(AdminManagementQuery.findAdminByPhone, [phone, excludeAdminId]);
  if (holder) {
    throw new ConflictException(PHONE_IN_USE_MESSAGE);
  }
};

// Every permission id must exist; unknown ids would otherwise be silently dropped.
const assertKnownPermissions = async (t: Queryable, permissionIds: string[]) => {
  const unique = [...new Set(permissionIds)];
  if (unique.length === 0) return;
  const { count } = await t.one(AdminManagementQuery.countKnownPermissions, [unique]);
  if (count !== unique.length) {
    throw new BadException('One or more permissions are not recognised.');
  }
};

// Bulk rows are validated individually: names are title-cased, the email lower-cased and the
// optional phone normalised.
const prepareInviteRow = (row: dtos.InviteRowDTO): { row: dtos.InviteRowDTO; error?: string } => {
  const prepared = new dtos.InviteRowDTO({
    ...row,
    first_name: titleCaseName(row.first_name ?? ''),
    last_name: titleCaseName(row.last_name ?? ''),
    email: `${row.email ?? ''}`.trim().toLowerCase(),
    role_id: `${row.role_id ?? ''}`.trim(),
  });
  if (!prepared.first_name || !prepared.last_name) {
    return { row: prepared, error: 'First and last name are required.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prepared.email)) {
    return { row: prepared, error: 'Enter a valid email address.' };
  }
  const rawPhone = row.phone_number === undefined || row.phone_number === null ? '' : `${row.phone_number}`.trim();
  if (rawPhone === '') {
    prepared.phone_number = undefined;
    return { row: prepared };
  }
  const phone = normalisePhoneNumber(rawPhone);
  if (!phone) {
    prepared.phone_number = rawPhone;
    return { row: prepared, error: INVALID_PHONE_MESSAGE };
  }
  prepared.phone_number = phone;
  return { row: prepared };
};

const audit = (
  t: Queryable,
  actor: string | null | undefined,
  action: string,
  module: string,
  entityType: string,
  reference: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
) => t.none(AdminManagementQuery.createAuditLog, [
  actor ?? null, action, module, entityType, reference,
  before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null,
]);

export class AdminManagementRepositoryImpl implements AdminManagementInterface {
  public async createRole(
    payload: dtos.CreateRoleDTO,
  ): Promise<BadException | entities.RoleEntity> {
    try {
      const response = await db.tx(async (t) => {
        const { role_name, description, permission_ids, performed_by } = payload;
        const roleExists = await t.oneOrNone(AdminManagementQuery.findRoleByName, [role_name]);
        if (roleExists) {
          throw new BadException('Role name already exists.');
        }
        await assertKnownPermissions(t, permission_ids);
        const role = await t.one(AdminManagementQuery.createRole, [role_name, description, performed_by ?? null]);
        await t.none(AdminManagementQuery.attachRolePermissions, [role.id, permission_ids]);
        await audit(t, performed_by, 'role:create', 'roles_and_permissions', 'role', role.id,
          null, { role: role_name, description, permission_ids });
        return role;
      });
      return await this.fetchRoleById({ role_id: response.id }) as entities.RoleEntity;
    } catch (error) {
      if (error instanceof BadException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async fetchRoles(
    payload: dtos.FetchRolesDTO,
  ): Promise<[any, entities.RoleEntity[]]> {
    const isActive = payload.is_active === undefined ? null : payload.is_active === 'true';
    const [meta, results] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: AdminManagementQuery.fetchRoles,
      params: [payload.search ?? '', isActive],
    });
    return [meta, results.map((row: any) => toRole(row))];
  };

  public async fetchRoleById(
    payload: dtos.FetchRoleByIdDTO,
  ): Promise<NotFoundException | entities.RoleEntity> {
    const role = await db.oneOrNone(AdminManagementQuery.fetchRoleDetailsById, [payload.role_id]);
    if (!role) {
      return new NotFoundException('Role not found.');
    }
    const permissions = await db.manyOrNone(AdminManagementQuery.fetchRolePermissions, [payload.role_id]);
    return toRole(role, permissions.map((p) => new entities.PermissionEntity({ ...p })));
  };

  public async editRoleById(
    payload: dtos.EditRoleDTO,
  ): Promise<BadException | NotFoundException | entities.RoleEntity> {
    try {
      await db.tx(async (t) => {
        const { role_id, role_name, description, permission_ids, performed_by } = payload;
        const existingRole = await t.oneOrNone(AdminManagementQuery.fetchRoleById, [role_id]);
        if (!existingRole) {
          throw new NotFoundException('Role not found.');
        }
        if (existingRole.is_system) {
          throw new BadException(SYSTEM_ROLE_MESSAGE);
        }
        if (permission_ids.length === 0) {
          throw new BadException('Select at least one permission.');
        }
        const duplicate = await t.oneOrNone(AdminManagementQuery.findRoleByNameExcludingId, [role_name, role_id]);
        if (duplicate) {
          throw new BadException('Role name already exists.');
        }
        await assertKnownPermissions(t, permission_ids);
        const before = await t.manyOrNone(AdminManagementQuery.fetchRolePermissions, [role_id]);
        await t.one(AdminManagementQuery.editRoleById, [role_id, role_name, description]);
        await t.none(AdminManagementQuery.removeRolePermissionsNotIn, [role_id, permission_ids]);
        await t.none(AdminManagementQuery.attachRolePermissions, [role_id, permission_ids]);
        await audit(t, performed_by, 'role:update', 'roles_and_permissions', 'role', role_id,
          { role: existingRole.role, description: existingRole.description, permission_ids: before.map((p) => p.id) },
          { role: role_name, description, permission_ids });
      });
      return await this.fetchRoleById({ role_id: payload.role_id });
    } catch (error) {
      if (error instanceof BadException || error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async deleteRoleById(
    payload: dtos.DeleteRoleDTO,
  ): Promise<BadException | NotFoundException | void> {
    try {
      await db.tx(async (t) => {
        const role = await t.oneOrNone(AdminManagementQuery.fetchRoleById, [payload.role_id]);
        if (!role) {
          throw new NotFoundException('Role not found.');
        }
        if (role.is_system) {
          throw new BadException(SYSTEM_ROLE_MESSAGE);
        }
        const { count } = await t.one(AdminManagementQuery.findRoleAdminCount, [payload.role_id]);
        if (count > 0) {
          throw new BadException('Reassign users before deleting this role.');
        }
        await t.none(AdminManagementQuery.deleteRoleById, [payload.role_id]);
        await audit(t, payload.performed_by, 'role:delete', 'roles_and_permissions', 'role', payload.role_id,
          { role: role.role }, null);
      });
    } catch (error) {
      if (error instanceof BadException || error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  private async setRoleStatus(
    payload: dtos.ToggleRoleStatusDTO,
    isActive: boolean,
    action: string,
  ): Promise<BadException | NotFoundException | entities.RoleEntity> {
    try {
      await db.tx(async (t) => {
        const role = await t.oneOrNone(AdminManagementQuery.fetchRoleById, [payload.role_id]);
        if (!role) {
          throw new NotFoundException('Role not found.');
        }
        if (role.is_system) {
          throw new BadException(SYSTEM_ROLE_MESSAGE);
        }
        await t.one(AdminManagementQuery.setRoleActiveStatus, [payload.role_id, isActive]);
        await audit(t, payload.performed_by, action, 'roles_and_permissions', 'role', payload.role_id,
          { is_active: role.is_active }, { is_active: isActive });
      });
      return await this.fetchRoleById({ role_id: payload.role_id });
    } catch (error) {
      if (error instanceof BadException || error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async deactivateRoleById(
    payload: dtos.ToggleRoleStatusDTO,
  ): Promise<BadException | NotFoundException | entities.RoleEntity> {
    return this.setRoleStatus(payload, false, 'role:deactivate');
  };

  public async activateRoleById(
    payload: dtos.ToggleRoleStatusDTO,
  ): Promise<BadException | NotFoundException | entities.RoleEntity> {
    return this.setRoleStatus(payload, true, 'role:activate');
  };

  public async fetchPermissions(
    payload: dtos.FetchPermissionsDTO,
  ): Promise<[any, entities.PermissionEntity[]]> {
    const [meta, results] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: AdminManagementQuery.fetchPermissions,
      params: [payload.category ?? ''],
    });
    return [meta, results.map(({ count, ...row }: any) => new entities.PermissionEntity({ ...row }))];
  };

  public async reassignRole(
    payload: dtos.ReassignRoleDTO,
  ): Promise<HttpException | entities.StaffEntity> {
    try {
      await db.tx(async (t) => {
        const admin = await t.oneOrNone(AdminManagementQuery.findStaffById, [payload.admin_id]);
        if (!admin) {
          throw new NotFoundException('Admin not found.');
        }
        if (admin.role_id === payload.role_id) return;
        if (payload.admin_id === payload.performed_by) {
          throw new ForbiddenException(SELF_ROLE_CHANGE_MESSAGE);
        }
        if (admin.is_root_account) {
          throw new ForbiddenException(ROOT_ACCOUNT_MESSAGE);
        }
        const role = await t.oneOrNone(AdminManagementQuery.findRoleByIdWithName, [payload.role_id]);
        if (!role) {
          throw new NotFoundException('Role not found.');
        }
        await t.one(AdminManagementQuery.reassignRole, [payload.admin_id, payload.role_id]);
        await audit(t, payload.performed_by, 'admin:reassign_role', 'staff_management', 'admin', payload.admin_id,
          { role_id: admin.role_id }, { role_id: payload.role_id, role: role.role });
      });
      return await this.fetchStaffById({ admin_id: payload.admin_id });
    } catch (error) {
      if (error instanceof HttpException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async fetchStaff(
    payload: dtos.FetchStaffDTO,
  ): Promise<[any, entities.StaffEntity[]]> {
    const [meta, results] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: AdminManagementQuery.fetchStaff,
      params: [
        payload.search ?? '',
        payload.status ? STAFF_STATUS_FILTER[payload.status] ?? null : null,
        payload.role_id ?? null,
        payload.from ?? null,
        payload.to ?? null,
        payload.sort ?? 'newest',
      ],
    });
    return [meta, results.map(toStaff)];
  };

  public async fetchStaffSummary(): Promise<entities.StaffSummaryEntity> {
    return new entities.StaffSummaryEntity(await db.one(AdminManagementQuery.fetchStaffSummary));
  };

  public async fetchStaffById(
    payload: dtos.FetchStaffByIdDTO,
  ): Promise<NotFoundException | entities.StaffEntity> {
    const staff = await db.oneOrNone(AdminManagementQuery.fetchStaffDetailsById, [payload.admin_id]);
    if (!staff) {
      return new NotFoundException('Staff member not found.');
    }
    const permissions = staff.role_id
      ? await db.manyOrNone(AdminManagementQuery.fetchRolePermissions, [staff.role_id])
      : [];
    return new entities.StaffEntity({
      ...staff,
      permissions: permissions.map((p) => new entities.PermissionEntity({ ...p })),
    });
  };

  public async editStaff(
    payload: dtos.EditStaffDTO,
  ): Promise<HttpException | entities.StaffEntity> {
    try {
      await db.tx(async (t) => {
        const { admin_id, first_name, last_name, role_id, phone_number, performed_by } = payload;
        const updatesPhone = phone_number !== undefined;
        const phone = phone_number ? phone_number : null;
        const admin = await t.oneOrNone(AdminManagementQuery.findStaffById, [admin_id]);
        if (!admin) {
          throw new NotFoundException('Staff member not found.');
        }
        // Admins may edit their own name/phone here, but never their own role.
        if (admin.role_id !== role_id) {
          if (admin_id === performed_by) throw new ForbiddenException(SELF_ROLE_CHANGE_MESSAGE);
          if (admin.is_root_account) throw new ForbiddenException(ROOT_ACCOUNT_MESSAGE);
        }
        const role = await t.oneOrNone(AdminManagementQuery.findRoleByIdWithName, [role_id]);
        if (!role) {
          throw new NotFoundException('Role not found.');
        }
        if (updatesPhone) {
          await assertPhoneAvailable(t, phone, admin_id);
        }
        await t.one(AdminManagementQuery.editStaff, [
          admin_id, first_name, last_name, role_id, updatesPhone, phone,
        ]);
        await audit(t, performed_by, 'admin:update', 'staff_management', 'admin', admin_id,
          { first_name: admin.first_name, last_name: admin.last_name, role_id: admin.role_id },
          { first_name, last_name, role_id, ...(updatesPhone ? { phone_number: phone } : {}) });
      });
      return await this.fetchStaffById({ admin_id: payload.admin_id });
    } catch (error) {
      if (error instanceof HttpException) {
        return error;
      }
      if (isPhoneUniqueViolation(error)) {
        return new ConflictException(PHONE_IN_USE_MESSAGE);
      }
      return new BadException(`${error.message}`);
    }
  };

  public async suspendStaff(
    payload: dtos.SuspendStaffDTO,
  ): Promise<BadException | NotFoundException | entities.StaffEntity> {
    try {
      await db.tx(async (t) => {
        if (payload.admin_id === payload.performed_by) {
          throw new BadException('You cannot suspend yourself.');
        }
        const admin = await t.oneOrNone(AdminManagementQuery.findStaffById, [payload.admin_id]);
        if (!admin) {
          throw new NotFoundException('Staff member not found.');
        }
        if (admin.is_root_account) {
          throw new BadException(ROOT_ACCOUNT_MESSAGE);
        }
        if (admin.staff_status !== 'active') {
          throw new BadException('Only active staff members can be suspended.');
        }
        await t.one(AdminManagementQuery.suspendStaff, [payload.admin_id]);
        await audit(t, payload.performed_by, 'admin:suspend', 'staff_management', 'admin', payload.admin_id,
          null, { reason: payload.reason ?? null });
      });
      return await this.fetchStaffById({ admin_id: payload.admin_id });
    } catch (error) {
      if (error instanceof BadException || error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async reactivateStaff(
    payload: dtos.ReactivateStaffDTO,
  ): Promise<BadException | NotFoundException | entities.StaffEntity> {
    try {
      await db.tx(async (t) => {
        if (payload.admin_id === payload.performed_by) {
          throw new BadException('You cannot reactivate yourself.');
        }
        const admin = await t.oneOrNone(AdminManagementQuery.findStaffById, [payload.admin_id]);
        if (!admin) {
          throw new NotFoundException('Staff member not found.');
        }
        if (admin.staff_status !== 'suspended') {
          throw new BadException('Only suspended staff members can be reactivated.');
        }
        await t.one(AdminManagementQuery.reactivateStaff, [payload.admin_id]);
        await audit(t, payload.performed_by, 'admin:reactivate', 'staff_management', 'admin', payload.admin_id,
          null, null);
      });
      return await this.fetchStaffById({ admin_id: payload.admin_id });
    } catch (error) {
      if (error instanceof BadException || error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  // Creates one pending admin inside `t`. Throws BadException / ConflictException on a rejected row.
  private async createInvitation(
    t: Queryable,
    row: { first_name: string; last_name: string; email: string; phone_number?: string; role_id: string },
    performedBy: string | null | undefined,
    action: string,
  ): Promise<{ id: string; role: string; token: string }> {
    const existing = await t.oneOrNone(AdminManagementQuery.findAdminByEmailIncludingDeleted, [row.email]);
    if (existing) {
      throw new BadException('Email already exists.');
    }
    const role = await t.oneOrNone(AdminManagementQuery.findRoleByIdWithName, [row.role_id]);
    if (!role) {
      throw new BadException('Role not found.');
    }
    await assertPhoneAvailable(t, row.phone_number, null);
    const { token, hashed, expiresAt } = generateInviteToken();
    const admin = await t.one(AdminManagementQuery.inviteStaff, [
      row.first_name, row.last_name, row.email, row.phone_number ?? null, row.role_id, hashed, expiresAt,
      performedBy ?? null,
    ]);
    await audit(t, performedBy, action, 'staff_management', 'admin', admin.id,
      null, { email: row.email, role_id: row.role_id });
    return { id: admin.id, role: role.role, token };
  };

  public async inviteStaff(
    payload: dtos.InviteStaffDTO,
  ): Promise<HttpException | entities.StaffEntity> {
    try {
      const response = await db.tx((t) => this.createInvitation(t, {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email.trim().toLowerCase(),
        phone_number: payload.phone_number,
        role_id: payload.role_id,
      }, payload.performed_by, 'staff:invite'));
      const staff = await this.fetchStaffById({ admin_id: response.id }) as entities.StaffEntity;
      staff.invite_token = response.token;
      return staff;
    } catch (error) {
      if (error instanceof HttpException) {
        return error;
      }
      if (isPhoneUniqueViolation(error)) {
        return new ConflictException(PHONE_IN_USE_MESSAGE);
      }
      return new BadException(`${error.message}`);
    }
  };

  public async previewBulkInvite(
    payload: dtos.PreviewBulkInviteDTO,
  ): Promise<entities.InviteRowResultEntity[]> {
    const results: entities.InviteRowResultEntity[] = [];
    const emailsInFile = new Set<string>();
    const phonesInFile = new Set<string>();
    for (const original of payload.invitees) {
      const { row, error } = prepareInviteRow(original);
      const { first_name, last_name, email, phone_number, role_id } = row;
      const invalid = (reason: string) => results.push(new entities.InviteRowResultEntity({
        first_name, last_name, email, phone_number, role_id, status: 'invalid', reason,
      }));
      if (error) {
        invalid(error);
        continue;
      }
      // A value repeated within the same file would collide on the second insert.
      if (emailsInFile.has(email)) {
        invalid('Email is repeated in this file.');
        continue;
      }
      emailsInFile.add(email);
      const existing = await db.oneOrNone(AdminManagementQuery.findAdminByEmailIncludingDeleted, [email]);
      if (existing) {
        invalid('Email already exists.');
        continue;
      }
      const role = await db.oneOrNone(AdminManagementQuery.findRoleByIdWithName, [role_id]);
      if (!role) {
        invalid('Role not found.');
        continue;
      }
      if (phone_number) {
        const holder = phonesInFile.has(phone_number)
          || await db.oneOrNone(AdminManagementQuery.findAdminByPhone, [phone_number, null]);
        if (holder) {
          invalid(PHONE_IN_USE_MESSAGE);
          continue;
        }
        phonesInFile.add(phone_number);
      }
      results.push(new entities.InviteRowResultEntity({
        first_name, last_name, email, phone_number, role_id, role: role.role, status: 'valid', reason: 'Ready to invite',
      }));
    }
    return results;
  };

  public async bulkInviteStaff(
    payload: dtos.BulkInviteStaffDTO,
  ): Promise<BadException | entities.InviteRowResultEntity[]> {
    try {
      const results: entities.InviteRowResultEntity[] = [];
      for (const original of payload.invitees) {
        const { row, error } = prepareInviteRow(original);
        const { first_name, last_name, email, phone_number, role_id } = row;
        if (error) {
          results.push(new entities.InviteRowResultEntity({
            first_name, last_name, email, phone_number, role_id, status: 'invalid', reason: error,
          }));
          continue;
        }
        try {
          const response = await db.tx((t) => this.createInvitation(t, row, payload.performed_by, 'staff:bulk_invite'));
          results.push(new entities.InviteRowResultEntity({
            first_name, last_name, email, phone_number, role_id, role: response.role,
            status: 'invited', reason: 'Invitation sent', invite_token: response.token,
          }));
        } catch (rowError) {
          const phoneTaken = rowError instanceof ConflictException || isPhoneUniqueViolation(rowError);
          results.push(new entities.InviteRowResultEntity({
            first_name, last_name, email, phone_number, role_id,
            status: phoneTaken ? 'invalid' : 'failed',
            reason: phoneTaken
              ? PHONE_IN_USE_MESSAGE
              : rowError instanceof BadException ? rowError.message : 'Unexpected error',
          }));
        }
      }
      return results;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async acceptInvite(
    payload: dtos.AcceptInviteDTO,
  ): Promise<BadException | NotFoundException | void> {
    try {
      await db.tx(async (t) => {
        const admin = await t.oneOrNone(AdminManagementQuery.findAdminByInvitationToken, [hashToken(payload.token)]);
        if (!admin) {
          throw new NotFoundException('Invalid or expired invitation link.');
        }
        if (admin.staff_status !== 'pending_invitation') {
          throw new BadException('This invitation has already been accepted.');
        }
        if (new Date(admin.invitation_expires_at).getTime() < Date.now()) {
          throw new BadException('This invitation link has expired. Please ask for a new one.');
        }
        await t.one(AdminManagementQuery.acceptInvite, [admin.id, payload.new_password]);
        await audit(t, admin.id, 'staff:accept_invite', 'staff_management', 'admin', admin.id, null, null);
      });
    } catch (error) {
      if (error instanceof BadException || error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async resendInvite(
    payload: dtos.ResendInviteDTO,
  ): Promise<HttpException | entities.StaffEntity> {
    try {
      const token = await db.tx(async (t) => {
        const admin = await t.oneOrNone(AdminManagementQuery.findPendingInvite, [payload.admin_id]);
        if (!admin) {
          throw new NotFoundException('Staff member not found.');
        }
        if (admin.staff_status !== 'pending_invitation') {
          throw new ConflictException('This staff member has already accepted their invite.');
        }
        // invitation_expires_at = sent_at + TTL, so the last send time can be derived from it.
        const lastSentAt = admin.invitation_expires_at
          ? new Date(admin.invitation_expires_at).getTime() - INVITE_TOKEN_TTL_HOURS * 60 * 60 * 1000
          : 0;
        if (Date.now() - lastSentAt < INVITE_RESEND_COOLDOWN_SECONDS * 1000) {
          throw new HttpException(429, 'An invite was just sent. Please wait a minute before resending.');
        }
        const invite = generateInviteToken();
        await t.none(AdminManagementQuery.renewInvitation, [payload.admin_id, invite.hashed, invite.expiresAt]);
        await audit(t, payload.performed_by, 'staff:resend_invite', 'staff_management', 'admin', payload.admin_id,
          null, { email: admin.email });
        return invite.token;
      });
      const staff = await this.fetchStaffById({ admin_id: payload.admin_id }) as entities.StaffEntity;
      staff.invite_token = token;
      return staff;
    } catch (error) {
      if (error instanceof HttpException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async fetchStaffActivity(
    payload: dtos.FetchStaffActivityDTO,
  ): Promise<NotFoundException | [any, entities.ActivityEntity[]]> {
    const staff = await db.oneOrNone(AdminManagementQuery.findStaffById, [payload.admin_id]);
    if (!staff) {
      return new NotFoundException('Staff member not found.');
    }
    const [meta, results] = await fetchResourceByPage({
      page: payload.page,
      limit: payload.limit,
      getResources: AdminManagementQuery.fetchStaffActivity,
      params: [payload.admin_id],
    });
    return [meta, results.map(({ actor_admin_id, actor_name, count, ...row }: any) => new entities.ActivityEntity({
      ...row,
      actor: actor_admin_id ? { id: actor_admin_id, name: actor_name ?? '' } : null,
    }))];
  };
}

const adminManagementRepository = new AdminManagementRepositoryImpl();

export default adminManagementRepository;
