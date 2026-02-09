import { BaseEntity } from '../../shared/utils/base-entity';

export class GetProfileDTO extends BaseEntity<GetProfileDTO> {
  user_id: string;
}

export class UpdateProfileDTO extends BaseEntity<UpdateProfileDTO> {
  user_id: string;
  first_name?: string;
  last_name?: string;
  country_code?: string;
  phone_number?: string;
  avatar?: string;
  username?: string;
  bio?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}
