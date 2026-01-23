import { BaseEntity } from '../../shared/utils/base-entity';

export class CreateProfileDto extends BaseEntity<CreateProfileDto> {
  profile_id: string;
}
