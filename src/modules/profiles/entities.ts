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

export class UserFollowEntity extends BaseEntity<UserFollowEntity> {
  id?: string;
  follower_id?: string;
  following_id?: string;
  created_at?: Date;
}

export class TribeMemberEntity extends BaseEntity<TribeMemberEntity> {
  id?: string;
  username?: string;
  avatar?: string;
  followed_at?: Date;
}

export class UserConnectionEntity extends BaseEntity<UserConnectionEntity> {
  id?: string;
  user_id?: string;
  connected_user_id?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  created_at?: Date;
  updated_at?: Date;
}

export class CircleRequestEntity extends BaseEntity<CircleRequestEntity> {
  id?: string;
  user_id?: string;
  connected_user_id?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  created_at?: Date;
  updated_at?: Date;
  username?: string;
  avatar?: string;
}

export class CircleMemberEntity extends BaseEntity<CircleMemberEntity> {
  id?: string;
  username?: string;
  avatar?: string;
  connected_at?: Date;
}
