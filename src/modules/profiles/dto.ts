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

// Circle DTOs
export class SendCircleRequestDTO extends BaseEntity<SendCircleRequestDTO> {
  user_id: string;
  connected_user_id: string;
}

export class AcceptCircleRequestDTO extends BaseEntity<AcceptCircleRequestDTO> {
  user_id: string;
  request_id: string;
}

export class RejectCircleRequestDTO extends BaseEntity<RejectCircleRequestDTO> {
  user_id: string;
  request_id: string;
}

export class GetCircleMembersDTO extends BaseEntity<GetCircleMembersDTO> {
  user_id: string;
  limit?: number;
  offset?: number;
}

export class RemoveFromCircleDTO extends BaseEntity<RemoveFromCircleDTO> {
  user_id: string;
  connected_user_id: string;
}

export class GetCircleRequestsDTO extends BaseEntity<GetCircleRequestsDTO> {
  user_id: string;
}
