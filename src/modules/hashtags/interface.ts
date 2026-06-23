import * as dtos from './dto';
import * as entities from './entities';
import { BadException, NotFoundException } from '../../shared/lib/errors';

export interface HashtagsInterface {
  getHashtag(tag: string): Promise<NotFoundException | entities.HashtagEntity>;
  getPostsByHashtag(dto: dtos.GetHashtagFeedDTO): Promise<BadException | { tag: string; posts_count: number; posts: any[]; pagination: any }>;
  getTrendingHashtags(dto: dtos.TrendingHashtagsDTO): Promise<BadException | entities.HashtagEntity[]>;
  searchHashtags(dto: dtos.SearchHashtagDTO): Promise<BadException | { tag: string; posts_count: number }[]>;
}
