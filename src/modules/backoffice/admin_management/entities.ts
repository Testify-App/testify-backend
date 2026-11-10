import { BaseEntity } from '../../../shared/utils/base-entity';

export class PermissionEntity extends BaseEntity<PermissionEntity> {
  id: string;
  category: string;
  permission: string;
  description: string;
};

export class RoleEntity extends BaseEntity<RoleEntity> {
  id: string;
  role: string;
  description: string;
  is_active: boolean;
  is_system: boolean;
  admin_count?: number;
  permission_count?: number;
  permissions?: PermissionEntity[];
  created_at?: Date;
  created_by?: { id: string; name: string } | null;
};

export class InviteRowResultEntity extends BaseEntity<InviteRowResultEntity> {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role_id?: string;
  role?: string;
  status: 'valid' | 'invalid' | 'invited' | 'failed';
  reason?: string;
  invite_token?: string; // transient: only populated on 'invited' rows, used by the service layer to build the email link, never serialized back to the client
};

export class StaffEntity extends BaseEntity<StaffEntity> {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  status?: string;
  staff_status?: string;
  avatar?: string;
  role_id?: string;
  role?: string;
  is_root_account?: boolean;
  last_login?: Date;
  created_at?: Date;
  permissions?: PermissionEntity[];
  invite_token?: string; // transient: only set on invite creation, used by the service layer to build the email link, never serialized back to the client
};

export class StaffSummaryEntity extends BaseEntity<StaffSummaryEntity> {
  total: number;
  active: number;
  suspended: number;
  pending_invitation: number;
};

export class ActivityEntity extends BaseEntity<ActivityEntity> {
  id: string;
  action: string;
  module: string;
  entity_type: string | null;
  entity_reference: string | null;
  target_name: string | null;
  actor: { id: string; name: string } | null;
  before_summary: Record<string, unknown> | null;
  after_summary: Record<string, unknown> | null;
  created_at: Date;
};
