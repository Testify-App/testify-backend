import * as dtos from './dto';
import * as entities from './entities';
import AdminManagementRepository, { INVITE_TOKEN_TTL_HOURS } from './repositories';
import { AdminManagementInterface } from './interface';
import {
  BadException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '../shared/lib/errors';
import logger from '../../../shared/services/logger';
import * as MailService from '../shared/lib/email';
import Env from '../../../shared/utils/env';
import hashingService from '../../../shared/services/hashing';
import { resolvePhoneInput, titleCaseName } from '../shared/lib/contact';

// Local admin app (Vite's default port), used only when running in development without
// TESTIFY_BACKOFFICE_PORTAL_URL.
const DEVELOPMENT_PORTAL_URL = 'http://localhost:5173';
export const PORTAL_URL_MISSING_MESSAGE =
  'Invitations can’t be sent: the admin portal address is not configured. '
  + 'Set TESTIFY_BACKOFFICE_PORTAL_URL to the portal’s full URL (e.g. https://admin.testifyhub.co).';

/**
 * Absolute base URL of the admin portal, or null when it isn't configured. Invite emails must
 * carry an absolute link: a relative one is unusable and, with email click-tracking, redirects
 * nowhere.
 */
export const portalBaseUrl = (): string | null => {
  const configured = `${Env.get<string>('BACKOFFICE_PORTAL_URL') ?? ''}`.trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^\s/]+/i.test(configured)) return configured;
  if (configured) {
    logger.error(`TESTIFY_BACKOFFICE_PORTAL_URL is not an absolute http(s) URL: "${configured}"`, 'admin_management.services.ts');
    return null;
  }
  if (Env.get<string>('NODE_ENV') === 'development') {
    logger.error(`TESTIFY_BACKOFFICE_PORTAL_URL is not set; invite links will use ${DEVELOPMENT_PORTAL_URL}`, 'admin_management.services.ts');
    return DEVELOPMENT_PORTAL_URL;
  }
  return null;
};

const buildInviteLink = (portalUrl: string, token: string): string => (
  `${portalUrl}/accept-invite?token=${encodeURIComponent(token)}`
);

export class AdminManagementServiceImpl implements AdminManagementInterface {
  public createRole = async (
    payload: dtos.CreateRoleDTO
  ): Promise<BadException | entities.RoleEntity> => {
    return await AdminManagementRepository.createRole(payload);
  };

  public fetchRoles = async (
    payload: dtos.FetchRolesDTO
  ): Promise<[any, entities.RoleEntity[]]> => {
    return await AdminManagementRepository.fetchRoles(payload);
  };

  public fetchRoleById = async (
    payload: dtos.FetchRoleByIdDTO
  ): Promise<NotFoundException | entities.RoleEntity> => {
    return await AdminManagementRepository.fetchRoleById(payload);
  };

  public editRoleById = async (
    payload: dtos.EditRoleDTO
  ): Promise<BadException | NotFoundException | entities.RoleEntity> => {
    return await AdminManagementRepository.editRoleById(payload);
  };

  public deleteRoleById = async (
    payload: dtos.DeleteRoleDTO
  ): Promise<BadException | NotFoundException | void> => {
    return await AdminManagementRepository.deleteRoleById(payload);
  };

  public deactivateRoleById = async (
    payload: dtos.ToggleRoleStatusDTO
  ): Promise<BadException | NotFoundException | entities.RoleEntity> => {
    return await AdminManagementRepository.deactivateRoleById(payload);
  };

  public activateRoleById = async (
    payload: dtos.ToggleRoleStatusDTO
  ): Promise<BadException | NotFoundException | entities.RoleEntity> => {
    return await AdminManagementRepository.activateRoleById(payload);
  };

  public fetchPermissions = async (
    payload: dtos.FetchPermissionsDTO
  ): Promise<[any, entities.PermissionEntity[]]> => {
    return await AdminManagementRepository.fetchPermissions(payload);
  };

  public reassignRole = async (
    payload: dtos.ReassignRoleDTO
  ): Promise<HttpException | entities.StaffEntity> => {
    return await AdminManagementRepository.reassignRole(payload);
  };

  public fetchStaff = async (
    payload: dtos.FetchStaffDTO
  ): Promise<[any, entities.StaffEntity[]]> => {
    return await AdminManagementRepository.fetchStaff(payload);
  };

  public fetchStaffSummary = async (): Promise<entities.StaffSummaryEntity> => {
    return await AdminManagementRepository.fetchStaffSummary();
  };

  public fetchStaffById = async (
    payload: dtos.FetchStaffByIdDTO
  ): Promise<NotFoundException | entities.StaffEntity> => {
    return await AdminManagementRepository.fetchStaffById(payload);
  };

  public editStaff = async (
    payload: dtos.EditStaffDTO
  ): Promise<HttpException | entities.StaffEntity> => {
    const phone = resolvePhoneInput(payload.phone_number);
    if (phone.error) {
      return new BadException(phone.error);
    }
    return await AdminManagementRepository.editStaff(new dtos.EditStaffDTO({
      ...payload,
      first_name: titleCaseName(payload.first_name),
      last_name: titleCaseName(payload.last_name),
      // undefined keeps the current number; null clears it.
      phone_number: phone.provided ? phone.value : undefined,
    }));
  };

  public suspendStaff = async (
    payload: dtos.SuspendStaffDTO
  ): Promise<BadException | NotFoundException | entities.StaffEntity> => {
    return await AdminManagementRepository.suspendStaff(payload);
  };

  public reactivateStaff = async (
    payload: dtos.ReactivateStaffDTO
  ): Promise<BadException | NotFoundException | entities.StaffEntity> => {
    return await AdminManagementRepository.reactivateStaff(payload);
  };

  public inviteStaff = async (
    payload: dtos.InviteStaffDTO
  ): Promise<HttpException | entities.StaffEntity> => {
    // Checked before anything is created, so a misconfigured server never leaves a pending
    // account whose invitation can't be opened.
    const portalUrl = portalBaseUrl();
    if (!portalUrl) return new InternalServerErrorException(PORTAL_URL_MISSING_MESSAGE);
    const phone = resolvePhoneInput(payload.phone_number);
    if (phone.error) {
      return new BadException(phone.error);
    }
    const admin = await AdminManagementRepository.inviteStaff(new dtos.InviteStaffDTO({
      ...payload,
      first_name: titleCaseName(payload.first_name),
      last_name: titleCaseName(payload.last_name),
      phone_number: phone.value ?? undefined,
    }));
    if (admin instanceof HttpException) {
      return admin;
    }
    await MailService.sendStaffInvite(
      admin.email as string,
      admin.first_name as string,
      admin.role as string,
      payload.performed_by_name ?? 'An administrator',
      buildInviteLink(portalUrl, admin.invite_token as string),
      INVITE_TOKEN_TTL_HOURS,
    );
    delete admin.invite_token;
    return admin;
  };

  public previewBulkInvite = async (
    payload: dtos.PreviewBulkInviteDTO
  ): Promise<entities.InviteRowResultEntity[]> => {
    return await AdminManagementRepository.previewBulkInvite(payload);
  };

  public bulkInviteStaff = async (
    payload: dtos.BulkInviteStaffDTO
  ): Promise<HttpException | entities.InviteRowResultEntity[]> => {
    const portalUrl = portalBaseUrl();
    if (!portalUrl) return new InternalServerErrorException(PORTAL_URL_MISSING_MESSAGE);
    const results = await AdminManagementRepository.bulkInviteStaff(payload);
    if (results instanceof BadException) {
      return results;
    }
    await Promise.all(
      results
        .filter((row) => row.status === 'invited' && row.invite_token)
        .map((row) => MailService.sendStaffInvite(
          row.email,
          row.first_name,
          row.role as string,
          payload.performed_by_name ?? 'An administrator',
          buildInviteLink(portalUrl, row.invite_token as string),
          INVITE_TOKEN_TTL_HOURS,
        )),
    );
    results.forEach((row) => {
      delete row.invite_token;
    });
    return results;
  };

  public acceptInvite = async (
    payload: dtos.AcceptInviteDTO
  ): Promise<BadException | NotFoundException | void> => {
    if (payload.new_password !== payload.confirm_new_password) {
      return new BadException('Password does not match confirm password field');
    }
    return await AdminManagementRepository.acceptInvite(
      new dtos.AcceptInviteDTO({ ...payload, new_password: await hashingService.hash(payload.new_password) }),
    );
  };

  public resendInvite = async (
    payload: dtos.ResendInviteDTO
  ): Promise<HttpException | entities.StaffEntity> => {
    const portalUrl = portalBaseUrl();
    if (!portalUrl) return new InternalServerErrorException(PORTAL_URL_MISSING_MESSAGE);
    const admin = await AdminManagementRepository.resendInvite(payload);
    if (admin instanceof HttpException) {
      return admin;
    }
    await MailService.sendStaffInvite(
      admin.email as string,
      admin.first_name as string,
      admin.role as string,
      payload.performed_by_name ?? 'An administrator',
      buildInviteLink(portalUrl, admin.invite_token as string),
      INVITE_TOKEN_TTL_HOURS,
    );
    delete admin.invite_token;
    return admin;
  };

  public fetchStaffActivity = async (
    payload: dtos.FetchStaffActivityDTO
  ): Promise<NotFoundException | [any, entities.ActivityEntity[]]> => {
    return await AdminManagementRepository.fetchStaffActivity(payload);
  };
}

const AdminManagementServices = new AdminManagementServiceImpl();

export default AdminManagementServices;
