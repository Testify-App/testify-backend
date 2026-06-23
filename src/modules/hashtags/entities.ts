import { BaseEntity } from '../../shared/utils/base-entity';

export class HashtagEntity extends BaseEntity<HashtagEntity> {
  id?: string;
  tag?: string;
  posts_count?: number;
  created_at?: Date;
}
