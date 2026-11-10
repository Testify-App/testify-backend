import * as dtos from './dto';
import * as entities from './entities';
import {
  BadException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';

export interface AdminManagementInterface {
  createRole(payload: dtos.CreateRoleDTO): Promise<BadException | entities.RoleEntity>;
  fetchRoles(payload: dtos.FetchRolesDTO): Promise<[any, entities.RoleEntity[]]>;
  fetchRoleById(payload: dtos.FetchRoleByIdDTO): Promise<NotFoundException | entities.RoleEntity>;
  editRoleById(payload: dtos.EditRoleDTO): Promise<BadException | NotFoundException | entities.RoleEntity>;
  deleteRoleById(payload: dtos.DeleteRoleDTO): Promise<BadException | NotFoundException | void>;
  deactivateRoleById(payload: dtos.ToggleRoleStatusDTO): Promise<BadException | NotFoundException | entities.RoleEntity>;
  activateRoleById(payload: dtos.ToggleRoleStatusDTO): Promise<BadException | NotFoundException | entities.RoleEntity>;
  fetchPermissions(payload: dtos.FetchPermissionsDTO): Promise<[any, entities.PermissionEntity[]]>;
  reassignRole(payload: dtos.ReassignRoleDTO): Promise<HttpException | entities.StaffEntity>;

  fetchStaff(payload: dtos.FetchStaffDTO): Promise<[any, entities.StaffEntity[]]>;
  fetchStaffSummary(): Promise<entities.StaffSummaryEntity>;
  fetchStaffById(payload: dtos.FetchStaffByIdDTO): Promise<NotFoundException | entities.StaffEntity>;
  editStaff(payload: dtos.EditStaffDTO): Promise<HttpException | entities.StaffEntity>;
  suspendStaff(payload: dtos.SuspendStaffDTO): Promise<BadException | NotFoundException | entities.StaffEntity>;
  reactivateStaff(payload: dtos.ReactivateStaffDTO): Promise<BadException | NotFoundException | entities.StaffEntity>;

  inviteStaff(payload: dtos.InviteStaffDTO): Promise<HttpException | entities.StaffEntity>;
  previewBulkInvite(payload: dtos.PreviewBulkInviteDTO): Promise<entities.InviteRowResultEntity[]>;
  bulkInviteStaff(payload: dtos.BulkInviteStaffDTO): Promise<HttpException | entities.InviteRowResultEntity[]>;
  acceptInvite(payload: dtos.AcceptInviteDTO): Promise<BadException | NotFoundException | void>;
  resendInvite(payload: dtos.ResendInviteDTO): Promise<HttpException | entities.StaffEntity>;
  fetchStaffActivity(payload: dtos.FetchStaffActivityDTO): Promise<NotFoundException | [any, entities.ActivityEntity[]]>;
};
