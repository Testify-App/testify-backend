import * as dtos from './dto';
import * as entities from './entities';
import StoriesRepository from './repositories';
import { StoriesInterface } from './interface';
import { BadException, NotFoundException, ForbiddenException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export class StoriesServiceImpl implements StoriesInterface {
  public async createStory(
    payload: dtos.CreateStoryDTO
  ): Promise<BadException | entities.StoryEntity> {
    return StoriesRepository.createStory(payload);
  }

  public async getCircleStories(
    payload: dtos.GetCircleStoriesDTO
  ): Promise<BadException | entities.UserStoriesGroupEntity[]> {
    return StoriesRepository.getCircleStories(payload);
  }

  public async getMyStories(
    payload: dtos.GetMyStoriesDTO
  ): Promise<BadException | entities.StoryEntity[]> {
    return StoriesRepository.getMyStories(payload);
  }

  public async getStory(
    payload: dtos.GetStoryDTO
  ): Promise<NotFoundException | ForbiddenException | entities.StoryEntity> {
    return StoriesRepository.getStory(payload);
  }

  public async deleteStory(
    payload: dtos.DeleteStoryDTO
  ): Promise<NotFoundException | void> {
    return StoriesRepository.deleteStory(payload);
  }

  public async getStoryViewers(
    payload: dtos.GetStoryViewersDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    return StoriesRepository.getStoryViewers(payload);
  }
}

const StoriesService = new StoriesServiceImpl();
export default StoriesService;
