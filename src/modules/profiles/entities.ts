import { BaseEntity } from '../../shared/utils/base-entity';

export class ProfileEntity extends BaseEntity<ProfileEntity> {
  id?: string;
  first_name?: string;
  last_name?: string;
  country_code?: string;
  phone_number?: string;
  email?: string;
  avatar?: string;
  username?: string;
  bio?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
  created_at?: Date;
  updated_at?: Date;
}
