import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import SearchService from './services';
import { fnRequest } from '../../shared/types';
import logger from '../../shared/services/logger';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException } from '../../shared/lib/errors';

export class SearchController {
  public search: fnRequest = async (req: Request, res: Response) => {
    const dto = new dtos.SearchQueryDTO(req.query as any);
    const response = await SearchService.search(dto);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'search.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Search completed successfully', 'search.controller.ts');
    return ResponseBuilder.success(res, 'Search results retrieved successfully', StatusCodes.OK, response);
  };
}

const searchController = new SearchController();
export default searchController;
