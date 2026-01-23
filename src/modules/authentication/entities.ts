import { BaseEntity } from '../../shared/utils/base-entity';

export class UserEntity extends BaseEntity<UserEntity> {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  username?: string;
  status?: string;
  avatar?: string;
  phone_number?: string;
  created_at?: Date;
  device_id?: string;
  otp?: string;
  token?: string;
  kyc_state?: number;
  session_id?: string
  hash_id_key?: string
};
