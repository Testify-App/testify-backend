import * as dtos from './dto';
import * as entities from './entities';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export interface CommunitiesInterface {
  createCommunity(payload: dtos.CreateCommunityDTO): Promise<BadException | entities.CommunityWithOwnerEntity>;
  getCommunity(payload: dtos.GetCommunityDTO): Promise<NotFoundException | entities.CommunityWithOwnerEntity>;
  getMyCommunities(payload: dtos.GetMyCommunitiesQueryDTO): Promise<BadException | FetchPaginatedResponse>;
  getJoinedCommunities(payload: dtos.GetJoinedCommunitiesQueryDTO): Promise<BadException | FetchPaginatedResponse>;
  updateCommunity(payload: dtos.UpdateCommunityDTO): Promise<BadException | NotFoundException | entities.CommunityWithOwnerEntity>;
  deleteCommunity(payload: dtos.DeleteCommunityDTO): Promise<BadException | NotFoundException | void>;
  joinCommunity(payload: dtos.JoinCommunityDTO): Promise<BadException | NotFoundException | { status: string }>;
  leaveCommunity(payload: dtos.LeaveCommunityDTO): Promise<BadException | NotFoundException | void>;
  getCommunityMembers(payload: dtos.GetCommunityMembersQueryDTO): Promise<BadException | NotFoundException | FetchPaginatedResponse>;
  getPendingRequests(payload: dtos.GetPendingRequestsQueryDTO): Promise<BadException | NotFoundException | FetchPaginatedResponse>;
  acceptJoinRequest(payload: dtos.ManageJoinRequestDTO): Promise<BadException | NotFoundException | void>;
  declineJoinRequest(payload: dtos.ManageJoinRequestDTO): Promise<BadException | NotFoundException | void>;
  removeMember(payload: dtos.RemoveMemberDTO): Promise<BadException | NotFoundException | void>;
  banMember(payload: dtos.BanMemberDTO): Promise<BadException | NotFoundException | void>;
  removeTestimony(payload: dtos.TestimonyActionDTO): Promise<BadException | NotFoundException | void>;
  pinTestimony(payload: dtos.TestimonyActionDTO): Promise<BadException | NotFoundException | void>;
  reportCommunity(payload: dtos.ReportDTO): Promise<BadException | NotFoundException | void>;
  reportTestimony(payload: dtos.ReportDTO): Promise<BadException | NotFoundException | void>;
  getReportedContent(payload: dtos.GetReportedContentQueryDTO): Promise<BadException | NotFoundException | FetchPaginatedResponse>;
  reviewReport(payload: dtos.ReviewReportDTO): Promise<BadException | NotFoundException | void>;
  createCommunityPost(payload: dtos.CreateCommunityPostDTO): Promise<BadException | NotFoundException | entities.CommunityTestimonyEntity>;
  getCommunityTestimonies(payload: dtos.GetCommunityTestimoniesQueryDTO): Promise<BadException | NotFoundException | FetchPaginatedResponse>;
  getUserCommunityTestimonies(payload: dtos.GetUserCommunityTestimoniesQueryDTO): Promise<BadException | NotFoundException | FetchPaginatedResponse>;
}
