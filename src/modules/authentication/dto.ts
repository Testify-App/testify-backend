import { BaseEntity } from '../../shared/utils/base-entity';
import { Profile } from './entities';

export class UserDto extends BaseEntity<UserDto> {
  id: string;
  email: string;
  password: string;
  verified: boolean;
  profile: Profile;
}