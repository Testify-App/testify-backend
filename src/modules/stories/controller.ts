import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import StoriesService from './services';
import { fnRequest } from '../../shared/types';
import { User } from '../../shared/interface';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException, NotFoundException, ForbiddenException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class StoriesController {
  public createStory: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.CreateStoryDTO(req.body);
    dto.user_id = req.user!.id;

    const response = await StoriesService.createStory(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Story posted successfully', StatusCodes.CREATED, response);
  };

  public getCircleStories: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetCircleStoriesDTO({ user_id: req.user!.id });

    const response = await StoriesService.getCircleStories(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Circle stories retrieved successfully', StatusCodes.OK, response);
  };

  public getMyStories: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetMyStoriesDTO({ user_id: req.user!.id });

    const response = await StoriesService.getMyStories(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Stories retrieved successfully', StatusCodes.OK, response);
  };

  public getStory: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetStoryDTO({
      user_id: req.user!.id,
      story_id: req.params.storyId,
    });

    const response = await StoriesService.getStory(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof ForbiddenException) {
      return ResponseBuilder.error(res, response, StatusCodes.FORBIDDEN);
    }
    return ResponseBuilder.success(res, 'Story retrieved successfully', StatusCodes.OK, response);
  };

  public deleteStory: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.DeleteStoryDTO({
      user_id: req.user!.id,
      story_id: req.params.storyId,
    });

    const response = await StoriesService.deleteStory(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    return ResponseBuilder.success(res, 'Story deleted successfully', StatusCodes.OK, null);
  };

  public getStoryViewers: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetStoryViewersDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.story_id = req.params.storyId;

    const response = await StoriesService.getStoryViewers(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Story viewers retrieved successfully', StatusCodes.OK, response);
  };
}

const storiesController = new StoriesController();
export default storiesController;
