import { BaseEntity } from '../../shared/utils/base-entity';

export class GetProfileDTO extends BaseEntity<GetProfileDTO> {
  user_id: string;
}

export class GetByUsernameDTO extends BaseEntity<GetByUsernameDTO> {
  username: string;
}

export class UpdateProfileDTO extends BaseEntity<UpdateProfileDTO> {
  user_id: string;
  first_name?: string;
  last_name?: string;
  country_code?: string;
  phone_number?: string;
  avatar?: string;
  display_name?: string;
  header_image?: string;
  username?: string;
  bio?: string;
  instagram?: string;
  youtube?: string;
  twitter?: string;
}

export class AddToTribeDTO extends BaseEntity<AddToTribeDTO> {
  user_id: string;
  following_id: string;
}

export class GetTribeMembersQueryDTO extends BaseEntity<GetTribeMembersQueryDTO> {
  user_id: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class GetFollowersQueryDTO extends BaseEntity<GetFollowersQueryDTO> {
  user_id: string;
  target_user_id: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class SearchProfilesByUsernameQueryDTO extends BaseEntity<SearchProfilesByUsernameQueryDTO> {
  user_id: string;
  search: string;
  page?: number;
  limit?: number;
}

export class FetchProfilePostHistoryByIdDTO extends BaseEntity<FetchProfilePostHistoryByIdDTO> {
  user_id: string;
  following_id: string;
  page?: number;
  limit?: number;
}

export class RemoveFromTribeDTO extends BaseEntity<RemoveFromTribeDTO> {
  user_id: string;
  following_id: string;
}

export class AddToCircleDTO extends BaseEntity<AddToCircleDTO> {
  user_id: string;
  connected_user_id: string;
}

export class GetCircleMembersDTO extends BaseEntity<GetCircleMembersDTO> {
  user_id: string;
  search: string;
  page?: number;
  limit?: number;
}

export class RemoveFromCircleDTO extends BaseEntity<RemoveFromCircleDTO> {
  user_id: string;
  connected_user_id: string;
}

export class GetCircleRequestsDTO extends BaseEntity<GetCircleRequestsDTO> {
  user_id: string;
}

export class BlockUserDTO extends BaseEntity<BlockUserDTO> {
  user_id: string;
  blocked_id: string;
}

export class UnblockUserDTO extends BaseEntity<UnblockUserDTO> {
  user_id: string;
  blocked_id: string;
}

export class GetBlockedUsersQueryDTO extends BaseEntity<GetBlockedUsersQueryDTO> {
  user_id: string;
  search?: string;
  page?: number;
  limit?: number;
}
