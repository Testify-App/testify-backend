import * as dtos from './dto';
import * as entities from './entities';
import CommunitiesRepository from './repositories';
import { CommunitiesInterface } from './interface';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export class CommunitiesServiceImpl implements CommunitiesInterface {
  public async createCommunity(
    payload: dtos.CreateCommunityDTO
  ): Promise<BadException | entities.CommunityWithOwnerEntity> {
    return CommunitiesRepository.createCommunity(payload);
  }

  public async getCommunity(
    payload: dtos.GetCommunityDTO
  ): Promise<NotFoundException | entities.CommunityWithOwnerEntity> {
    return CommunitiesRepository.getCommunity(payload);
  }

  public async getMyCommunities(
    payload: dtos.GetMyCommunitiesQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    return CommunitiesRepository.getMyCommunities(payload);
  }

  public async getJoinedCommunities(
    payload: dtos.GetJoinedCommunitiesQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    return CommunitiesRepository.getJoinedCommunities(payload);
  }

  public async updateCommunity(
    payload: dtos.UpdateCommunityDTO
  ): Promise<BadException | NotFoundException | entities.CommunityWithOwnerEntity> {
    return CommunitiesRepository.updateCommunity(payload);
  }

  public async deleteCommunity(
    payload: dtos.DeleteCommunityDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.deleteCommunity(payload);
  }

  public async joinCommunity(
    payload: dtos.JoinCommunityDTO
  ): Promise<BadException | NotFoundException | { status: string }> {
    return CommunitiesRepository.joinCommunity(payload);
  }

  public async leaveCommunity(
    payload: dtos.LeaveCommunityDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.leaveCommunity(payload);
  }

  public async getCommunityMembers(
    payload: dtos.GetCommunityMembersQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    return CommunitiesRepository.getCommunityMembers(payload);
  }

  public async getPendingRequests(
    payload: dtos.GetPendingRequestsQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    return CommunitiesRepository.getPendingRequests(payload);
  }

  public async acceptJoinRequest(
    payload: dtos.ManageJoinRequestDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.acceptJoinRequest(payload);
  }

  public async declineJoinRequest(
    payload: dtos.ManageJoinRequestDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.declineJoinRequest(payload);
  }

  public async removeMember(
    payload: dtos.RemoveMemberDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.removeMember(payload);
  }

  public async banMember(
    payload: dtos.BanMemberDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.banMember(payload);
  }

  public async removeTestimony(
    payload: dtos.TestimonyActionDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.removeTestimony(payload);
  }

  public async pinTestimony(
    payload: dtos.TestimonyActionDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.pinTestimony(payload);
  }

  public async reportCommunity(
    payload: dtos.ReportDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.reportCommunity(payload);
  }

  public async reportTestimony(
    payload: dtos.ReportDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.reportTestimony(payload);
  }

  public async getReportedContent(
    payload: dtos.GetReportedContentQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    return CommunitiesRepository.getReportedContent(payload);
  }

  public async reviewReport(
    payload: dtos.ReviewReportDTO
  ): Promise<BadException | NotFoundException | void> {
    return CommunitiesRepository.reviewReport(payload);
  }

  public async createCommunityPost(
    payload: dtos.CreateCommunityPostDTO
  ): Promise<BadException | NotFoundException | entities.CommunityTestimonyEntity> {
    return CommunitiesRepository.createCommunityPost(payload);
  }

  public async getCommunityTestimonies(
    payload: dtos.GetCommunityTestimoniesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    return CommunitiesRepository.getCommunityTestimonies(payload);
  }

  public async getUserCommunityTestimonies(
    payload: dtos.GetUserCommunityTestimoniesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    return CommunitiesRepository.getUserCommunityTestimonies(payload);
  }
}

const CommunitiesService = new CommunitiesServiceImpl();
export default CommunitiesService;
