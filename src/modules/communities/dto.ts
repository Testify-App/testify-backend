import { BaseEntity } from '../../shared/utils/base-entity';
import { CommunityRule, CommunityVisibility } from './entities';

export class CreateCommunityDTO extends BaseEntity<CreateCommunityDTO> {
  user_id: string;
  name: string;
  description?: string;
  category?: string;
  avatar?: string;
  cover_image?: string;
  visibility?: CommunityVisibility;
  rules?: CommunityRule[];
}

export class GetCommunityDTO extends BaseEntity<GetCommunityDTO> {
  user_id: string;
  community_id: string;
}

export class GetMyCommunitiesQueryDTO extends BaseEntity<GetMyCommunitiesQueryDTO> {
  user_id: string;
  page?: string;
  limit?: string;
}

export class GetJoinedCommunitiesQueryDTO extends BaseEntity<GetJoinedCommunitiesQueryDTO> {
  user_id: string;
  page?: string;
  limit?: string;
}

export class UpdateCommunityDTO extends BaseEntity<UpdateCommunityDTO> {
  user_id: string;
  community_id: string;
  name?: string;
  description?: string;
  category?: string;
  avatar?: string;
  cover_image?: string;
  visibility?: CommunityVisibility;
  rules?: CommunityRule[];
}

export class DeleteCommunityDTO extends BaseEntity<DeleteCommunityDTO> {
  user_id: string;
  community_id: string;
  confirm: string;
}

export class JoinCommunityDTO extends BaseEntity<JoinCommunityDTO> {
  user_id: string;
  community_id: string;
}

export class LeaveCommunityDTO extends BaseEntity<LeaveCommunityDTO> {
  user_id: string;
  community_id: string;
}

export class GetCommunityMembersQueryDTO extends BaseEntity<GetCommunityMembersQueryDTO> {
  user_id: string;
  community_id: string;
  page?: string;
  limit?: string;
}

export class GetPendingRequestsQueryDTO extends BaseEntity<GetPendingRequestsQueryDTO> {
  user_id: string;
  community_id: string;
  page?: string;
  limit?: string;
}

export class ManageJoinRequestDTO extends BaseEntity<ManageJoinRequestDTO> {
  user_id: string;
  community_id: string;
  target_user_id: string;
}

export class BanMemberDTO extends BaseEntity<BanMemberDTO> {
  user_id: string;
  community_id: string;
  target_user_id: string;
  reason?: string;
}

export class RemoveMemberDTO extends BaseEntity<RemoveMemberDTO> {
  user_id: string;
  community_id: string;
  target_user_id: string;
}

export class TestimonyActionDTO extends BaseEntity<TestimonyActionDTO> {
  user_id: string;
  community_id: string;
  testimony_id: string;
}

export class ReportDTO extends BaseEntity<ReportDTO> {
  user_id: string;
  community_id: string;
  testimony_id?: string;
  reason?: string;
}

export class GetReportedContentQueryDTO extends BaseEntity<GetReportedContentQueryDTO> {
  user_id: string;
  community_id: string;
  page?: string;
  limit?: string;
}

export class ReviewReportDTO extends BaseEntity<ReviewReportDTO> {
  user_id: string;
  community_id: string;
  report_id: string;
  status: 'reviewed' | 'dismissed';
}

export class CreateCommunityPostDTO extends BaseEntity<CreateCommunityPostDTO> {
  user_id: string;
  community_id: string;
  content?: string;
  media_attachments?: Array<{
    type: string;
    url: string;
    thumbnail_url?: string;
    duration?: number;
    size?: number;
    mime_type?: string;
    filename?: string;
    order_index?: number;
  }>;
}

export class GetCommunityTestimoniesQueryDTO extends BaseEntity<GetCommunityTestimoniesQueryDTO> {
  user_id: string;
  community_id: string;
  page?: string;
  limit?: string;
}

export class GetUserCommunityTestimoniesQueryDTO extends BaseEntity<GetUserCommunityTestimoniesQueryDTO> {
  requesting_user_id: string;
  target_user_id: string;
  page?: string;
  limit?: string;
}
