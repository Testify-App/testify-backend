import * as dtos from './dto';
import * as entities from './entities';
import { BadException, NotFoundException, ForbiddenException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export interface StoriesInterface {
  createStory(payload: dtos.CreateStoryDTO): Promise<BadException | entities.StoryEntity>;
  getCircleStories(payload: dtos.GetCircleStoriesDTO): Promise<BadException | entities.UserStoriesGroupEntity[]>;
  getMyStories(payload: dtos.GetMyStoriesDTO): Promise<BadException | entities.StoryEntity[]>;
  getStory(payload: dtos.GetStoryDTO): Promise<NotFoundException | ForbiddenException | entities.StoryEntity>;
  deleteStory(payload: dtos.DeleteStoryDTO): Promise<NotFoundException | void>;
  getStoryViewers(payload: dtos.GetStoryViewersDTO): Promise<BadException | NotFoundException | FetchPaginatedResponse>;
}
