import { BaseEntity } from '../../shared/utils/base-entity';

export class UserEntity extends BaseEntity<UserEntity> {
    id: string;
    email: string;
    password: string;
    verified: boolean;
    profile: Profile;
}

export type Profile = {
    id?: string;
    user_id?: string;
    first_name: string;
    last_name: string;
}