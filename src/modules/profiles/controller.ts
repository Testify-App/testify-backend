import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import ProfilesService from './services';
import { User } from '../../shared/interface';
import { fnRequest } from '../../shared/types';
import logger from '../../shared/services/logger';
import * as ResponseBuilder from '../../shared/lib/api-response';
import {
  NotFoundException,
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
    logger.info('Profile updated successfully', 'profiles.controller.ts');
    return ResponseBuilder.success(res, 'Profile updated successfully', StatusCodes.OK, response);
  };
}

const profilesController = new ProfilesController();

export default profilesController;
