import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import CommunitiesService from './services';
import { fnRequest } from '../../shared/types';
import { User } from '../../shared/interface';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException, NotFoundException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class CommunitiesController {
  public createCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.CreateCommunityDTO(req.body);
    dto.user_id = req.user!.id;

    const response = await CommunitiesService.createCommunity(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Community created successfully', StatusCodes.CREATED, response);
  };

  public getCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetCommunityDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
    });

    const response = await CommunitiesService.getCommunity(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    return ResponseBuilder.success(res, 'Community retrieved successfully', StatusCodes.OK, response);
  };

  public getMyCommunities: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetMyCommunitiesQueryDTO(req.query as any);
    dto.user_id = req.user!.id;

    const response = await CommunitiesService.getMyCommunities(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Communities retrieved successfully', StatusCodes.OK, response);
  };

  public getJoinedCommunities: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetJoinedCommunitiesQueryDTO(req.query as any);
    dto.user_id = req.user!.id;

    const response = await CommunitiesService.getJoinedCommunities(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Joined communities retrieved successfully', StatusCodes.OK, response);
  };

  public updateCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.UpdateCommunityDTO(req.body);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.updateCommunity(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Community updated successfully', StatusCodes.OK, response);
  };

  public deleteCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.DeleteCommunityDTO(req.body);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.deleteCommunity(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Community deleted successfully', StatusCodes.OK, null);
  };

  public joinCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.JoinCommunityDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
    });

    const response = await CommunitiesService.joinCommunity(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }

    const message =
      (response as { status: string }).status === 'pending'
        ? 'Join request sent'
        : 'Joined community successfully';
    return ResponseBuilder.success(res, message, StatusCodes.OK, response);
  };

  public leaveCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.LeaveCommunityDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
    });

    const response = await CommunitiesService.leaveCommunity(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Left community successfully', StatusCodes.OK, null);
  };

  public getCommunityMembers: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetCommunityMembersQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.getCommunityMembers(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Members retrieved successfully', StatusCodes.OK, response);
  };

  public getPendingRequests: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetPendingRequestsQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.getPendingRequests(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Join requests retrieved successfully', StatusCodes.OK, response);
  };

  public acceptJoinRequest: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ManageJoinRequestDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      target_user_id: req.params.userId,
    });

    const response = await CommunitiesService.acceptJoinRequest(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Join request accepted', StatusCodes.OK, null);
  };

  public declineJoinRequest: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ManageJoinRequestDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      target_user_id: req.params.userId,
    });

    const response = await CommunitiesService.declineJoinRequest(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Join request declined', StatusCodes.OK, null);
  };

  public removeMember: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.RemoveMemberDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      target_user_id: req.params.userId,
    });

    const response = await CommunitiesService.removeMember(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Member removed successfully', StatusCodes.OK, null);
  };

  public banMember: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.BanMemberDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      target_user_id: req.params.userId,
      reason: req.body.reason,
    });

    const response = await CommunitiesService.banMember(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Member banned successfully', StatusCodes.OK, null);
  };

  public removeTestimony: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.TestimonyActionDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      testimony_id: req.params.testimonyId,
    });

    const response = await CommunitiesService.removeTestimony(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Testimony removed successfully', StatusCodes.OK, null);
  };

  public pinTestimony: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.TestimonyActionDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      testimony_id: req.params.testimonyId,
    });

    const response = await CommunitiesService.pinTestimony(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Testimony pin updated successfully', StatusCodes.OK, null);
  };

  public reportCommunity: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ReportDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      reason: req.body.reason,
    });

    const response = await CommunitiesService.reportCommunity(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Community reported successfully', StatusCodes.OK, null);
  };

  public reportTestimony: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ReportDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      testimony_id: req.params.testimonyId,
      reason: req.body.reason,
    });

    const response = await CommunitiesService.reportTestimony(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Testimony reported successfully', StatusCodes.OK, null);
  };

  public getReportedContent: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetReportedContentQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.getReportedContent(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Reported content retrieved successfully', StatusCodes.OK, response);
  };

  public createCommunityPost: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.CreateCommunityPostDTO(req.body);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.createCommunityPost(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Testimony posted successfully', StatusCodes.CREATED, response);
  };

  public getCommunityTestimonies: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetCommunityTestimoniesQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.community_id = req.params.communityId;

    const response = await CommunitiesService.getCommunityTestimonies(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Testimonies retrieved successfully', StatusCodes.OK, response);
  };

  public getUserCommunityTestimonies: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetUserCommunityTestimoniesQueryDTO(req.query as any);
    dto.requesting_user_id = req.user!.id;
    dto.target_user_id = req.params.userId || req.user!.id;

    const response = await CommunitiesService.getUserCommunityTestimonies(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'User testimonies retrieved successfully', StatusCodes.OK, response);
  };

  public reviewReport: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ReviewReportDTO({
      user_id: req.user!.id,
      community_id: req.params.communityId,
      report_id: req.params.reportId,
      status: req.body.status,
    });

    const response = await CommunitiesService.reviewReport(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Report updated successfully', StatusCodes.OK, null);
  };
}

const communitiesController = new CommunitiesController();
export default communitiesController;
