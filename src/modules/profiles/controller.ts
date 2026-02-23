import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import ProfilesService from './services';
import { User } from '../../shared/interface';
import { fnRequest } from '../../shared/types';
import logger from '../../shared/services/logger';
import * as ResponseBuilder from '../../shared/lib/api-response';
import {
  BadException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class ProfilesController {
  public getProfile: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.GetProfileDTO();
    payload.user_id = req.user?.id as string;
    const response = await ProfilesService.getProfile(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Profile retrieved successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Profile retrieved successfully', StatusCodes.OK, response);
  };

  public updateProfile: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.UpdateProfileDTO(req.body);
    payload.user_id = req.user?.id as string;
    const response = await ProfilesService.updateProfile(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }
    logger.info('Profile updated successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Profile updated successfully', StatusCodes.OK, response);
  };

  public addToTribe: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.AddToTribeDTO(req.body);
    payload.user_id = req.user?.id as string;
    const response = await ProfilesService.addToTribe(payload);
    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('User added to Tribe successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Added to Tribe successfully', StatusCodes.CREATED, response);
  };

  public removeFromTribe: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.RemoveFromTribeDTO(req.params);
    payload.user_id = req.user?.id as string;
    const response = await ProfilesService.removeFromTribe(payload);
    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }
    logger.info('User removed from Tribe successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Removed from Tribe successfully', StatusCodes.OK, response);
  };

  public getTribeMembers: fnRequest = async (req: AuthenticatedRequest, res) => {
    const query = new dtos.GetTribeMembersQueryDTO(req.query);
    query.user_id = req.user?.id as string;
    const response = await ProfilesService.getTribeMembers(query);
    if (response instanceof InternalServerErrorException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    logger.info('Tribe members retrieved successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Tribe members retrieved', StatusCodes.OK, response);
  };

  public searchProfilesByUsername: fnRequest = async (req: AuthenticatedRequest, res) => {
    const query = new dtos.SearchProfilesByUsernameQueryDTO(req.query);
    query.user_id = req.user?.id as string;
    const response = await ProfilesService.searchProfilesByUsername(query);
    if (response instanceof InternalServerErrorException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    logger.info('Profiles searched successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Profiles found', StatusCodes.OK, response);
  };

  public isInTribe: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const followingId = req.params.userId;
    const response = await ProfilesService.isInTribe(userId, followingId);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    return ResponseBuilder.success(res, 'Tribe membership checked', StatusCodes.OK, { is_in_tribe: response });
  };

  public sendCircleRequest: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.SendCircleRequestDTO();
    payload.user_id = req.user?.id as string;
    payload.connected_user_id = req.body.connected_user_id;

    const response = await ProfilesService.sendCircleRequest(payload);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    if (response instanceof ConflictException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.CONFLICT);
    }

    if (response instanceof NotFoundException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }

    logger.info('Circle request sent successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Circle request sent', StatusCodes.CREATED, response);
  };

  public acceptCircleRequest: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.AcceptCircleRequestDTO();
    payload.user_id = req.user?.id as string;
    payload.request_id = req.params.requestId;

    const response = await ProfilesService.acceptCircleRequest(payload);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    if (response instanceof NotFoundException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }

    logger.info('Circle request accepted successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Circle request accepted', StatusCodes.OK, response);
  };

  public rejectCircleRequest: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.RejectCircleRequestDTO();
    payload.user_id = req.user?.id as string;
    payload.request_id = req.params.requestId;

    const response = await ProfilesService.rejectCircleRequest(payload);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    logger.info('Circle request rejected', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Circle request rejected', StatusCodes.OK, response);
  };

  public removeFromCircle: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.RemoveFromCircleDTO();
    payload.user_id = req.user?.id as string;
    payload.connected_user_id = req.params.userId;

    const response = await ProfilesService.removeFromCircle(payload);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    logger.info('User removed from Circle successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Removed from Circle successfully', StatusCodes.OK, response);
  };

  public getCircleMembers: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.GetCircleMembersDTO();
    payload.user_id = req.user?.id as string;
    payload.limit = parseInt(req.query.limit as string) || 20;
    payload.offset = parseInt(req.query.offset as string) || 0;

    const response = await ProfilesService.getCircleMembers(payload);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    logger.info('Circle members retrieved successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Circle members retrieved', StatusCodes.OK, response);
  };

  public getCircleCount: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const response = await ProfilesService.getCircleCount(userId);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    return ResponseBuilder.success(res, 'Circle count retrieved', StatusCodes.OK, { count: response });
  };

  public isInCircle: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const connectedUserId = req.params.userId;
    const response = await ProfilesService.isInCircle(userId, connectedUserId);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    return ResponseBuilder.success(res, 'Circle membership checked', StatusCodes.OK, { is_in_circle: response });
  };

  public getPendingRequests: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const response = await ProfilesService.getPendingRequests(userId);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    logger.info('Pending Circle requests retrieved', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Pending requests retrieved', StatusCodes.OK, response);
  };

  public getSentRequests: fnRequest = async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const response = await ProfilesService.getSentRequests(userId);

    if (response instanceof BadException) {
      logger.error(response.message, 'profiles.controller.ts');
      return ResponseBuilder.error(res, response, response.code);
    }

    logger.info('Sent Circle requests retrieved', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Sent requests retrieved', StatusCodes.OK, response);
  };
}

const profilesController = new ProfilesController();

export default profilesController;
