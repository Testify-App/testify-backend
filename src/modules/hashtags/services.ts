import * as dtos from './dto';
import * as entities from './entities';
import { HashtagsInterface } from './interface';
import HashtagsRepository from './repositories';
import { BadException, NotFoundException } from '../../shared/lib/errors';

export class HashtagsServiceImpl implements HashtagsInterface {
  public getHashtag = async (
    tag: string
  ): Promise<NotFoundException | entities.HashtagEntity> => {
    return await HashtagsRepository.getHashtag(tag);
  };

  public getPostsByHashtag = async (
    dto: dtos.GetHashtagFeedDTO
  ): Promise<BadException | { tag: string; posts_count: number; posts: any[]; pagination: any }> => {
    return await HashtagsRepository.getPostsByHashtag(dto);
  };

  public getTrendingHashtags = async (
    dto: dtos.TrendingHashtagsDTO
  ): Promise<BadException | entities.HashtagEntity[]> => {
    return await HashtagsRepository.getTrendingHashtags(dto);
  };

  public searchHashtags = async (
    dto: dtos.SearchHashtagDTO
  ): Promise<BadException | { tag: string; posts_count: number }[]> => {
    return await HashtagsRepository.searchHashtags(dto);
  };
}

const HashtagsService = new HashtagsServiceImpl();

export default HashtagsService;
