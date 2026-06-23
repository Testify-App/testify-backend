import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import HashtagsService from './services';
import { User } from '../../shared/interface';
import { fnRequest } from '../../shared/types';
import logger from '../../shared/services/logger';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException, NotFoundException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class HashtagsController {
  public getHashtag: fnRequest = async (req: Request, res) => {
    const tag = req.params.tag;
    const response = await HashtagsService.getHashtag(tag);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'hashtags.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Hashtag retrieved successfully', 'hashtags.controller.ts');
    return ResponseBuilder.success(res, 'Hashtag retrieved successfully', StatusCodes.OK, response);
  };

  public getPostsByHashtag: fnRequest = async (req: AuthenticatedRequest, res) => {
    const dto = new dtos.GetHashtagFeedDTO(req.query as any);
    dto.tag = req.params.tag;
    dto.user_id = req.user?.id;
    const response = await HashtagsService.getPostsByHashtag(dto);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'hashtags.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Hashtag feed retrieved successfully', 'hashtags.controller.ts');
    return ResponseBuilder.success(res, 'Hashtag feed retrieved successfully', StatusCodes.OK, response);
  };

  public getTrendingHashtags: fnRequest = async (req: Request, res) => {
    const dto = new dtos.TrendingHashtagsDTO(req.query as any);
    const response = await HashtagsService.getTrendingHashtags(dto);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'hashtags.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Trending hashtags retrieved successfully', 'hashtags.controller.ts');
    return ResponseBuilder.success(res, 'Trending hashtags retrieved successfully', StatusCodes.OK, { hashtags: response });
  };

  public searchHashtags: fnRequest = async (req: Request, res) => {
    const dto = new dtos.SearchHashtagDTO(req.query as any);
    const response = await HashtagsService.searchHashtags(dto);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'hashtags.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Hashtag search completed', 'hashtags.controller.ts');
    return ResponseBuilder.success(res, 'Hashtags retrieved successfully', StatusCodes.OK, { hashtags: response });
  };
}

const hashtagsController = new HashtagsController();

export default hashtagsController;
