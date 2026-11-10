import { BaseEntity } from '../../../shared/utils/base-entity';

export class AdminEntity extends BaseEntity<AdminEntity> {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  status?: string;
  staff_status?: string;
  avatar?: string;
  role_id?: string;
  is_root_account?: boolean;
  failed_login_attempts?: number;
  locked_at?: Date | null;
  otp?: string;
  otp_expiry_time?: Date | null;
  session_id?: string;
  last_login?: Date;
  jwt_token?: string;
  response_message?: string;
  hash_id_key?: string;
};

export class ProfileEntity extends BaseEntity<ProfileEntity> {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar: string | null;
  is_root_account: boolean;
  last_login: Date | null;
  role: { id: string; name: string; is_active: boolean; is_system: boolean } | null;
  permissions: string[];
};
