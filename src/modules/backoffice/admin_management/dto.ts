import { BaseEntity } from '../../../shared/utils/base-entity';

export class CreateRoleDTO extends BaseEntity<CreateRoleDTO> {
  role_name: string;
  description: string;
  permission_ids: string[];
  performed_by?: string;
};

export class EditRoleDTO extends BaseEntity<EditRoleDTO> {
  role_id: string;
  role_name: string;
  description: string;
  permission_ids: string[];
  performed_by?: string;
};

export class FetchRolesDTO extends BaseEntity<FetchRolesDTO> {
  page: string;
  limit: string;
  search?: string;
  is_active?: string;
};

export class FetchRoleByIdDTO extends BaseEntity<FetchRoleByIdDTO> {
  role_id: string;
};

export class DeleteRoleDTO extends BaseEntity<DeleteRoleDTO> {
  role_id: string;
  performed_by?: string;
};

export class ToggleRoleStatusDTO extends BaseEntity<ToggleRoleStatusDTO> {
  role_id: string;
  performed_by?: string;
};

export class FetchPermissionsDTO extends BaseEntity<FetchPermissionsDTO> {
  page: string;
  limit: string;
  category?: string;
};

export class ReassignRoleDTO extends BaseEntity<ReassignRoleDTO> {
  admin_id: string;
  role_id: string;
  performed_by?: string;
};

export class FetchStaffDTO extends BaseEntity<FetchStaffDTO> {
  page: string;
  limit: string;
  search?: string;
  status?: string;
  role_id?: string;
  from?: string;
  to?: string;
  sort?: 'newest' | 'name_asc' | 'name_desc';
};

export class FetchStaffByIdDTO extends BaseEntity<FetchStaffByIdDTO> {
  admin_id: string;
};

export class EditStaffDTO extends BaseEntity<EditStaffDTO> {
  admin_id: string;
  first_name: string;
  last_name: string;
  role_id: string;
  phone_number?: string | null;
  performed_by?: string;
};

export class SuspendStaffDTO extends BaseEntity<SuspendStaffDTO> {
  admin_id: string;
  reason?: string;
  performed_by?: string;
};

export class ReactivateStaffDTO extends BaseEntity<ReactivateStaffDTO> {
  admin_id: string;
  performed_by?: string;
};

export class InviteStaffDTO extends BaseEntity<InviteStaffDTO> {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role_id: string;
  performed_by?: string;
  performed_by_name?: string;
};

export class InviteRowDTO extends BaseEntity<InviteRowDTO> {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role_id: string;
};

export class PreviewBulkInviteDTO extends BaseEntity<PreviewBulkInviteDTO> {
  invitees: InviteRowDTO[];
};

export class BulkInviteStaffDTO extends BaseEntity<BulkInviteStaffDTO> {
  invitees: InviteRowDTO[];
  performed_by?: string;
  performed_by_name?: string;
};

export class AcceptInviteDTO extends BaseEntity<AcceptInviteDTO> {
  token: string;
  new_password: string;
  confirm_new_password: string;
};

export class ResendInviteDTO extends BaseEntity<ResendInviteDTO> {
  admin_id: string;
  performed_by?: string;
  performed_by_name?: string;
};

export class FetchStaffActivityDTO extends BaseEntity<FetchStaffActivityDTO> {
  admin_id: string;
  page: string;
  limit: string;
};
