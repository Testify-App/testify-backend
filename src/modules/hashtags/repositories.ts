import * as dtos from './dto';
import * as entities from './entities';
import HashtagsQuery from './query';
import { db } from '../../config/database';
import { HashtagsInterface } from './interface';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { calcPages } from '../../shared/helpers';

export class HashtagsRepositoryImpl implements HashtagsInterface {
  public async getHashtag(
    tag: string
  ): Promise<NotFoundException | entities.HashtagEntity> {
    try {
      const row = await db.oneOrNone(HashtagsQuery.getHashtagByTag, [tag.toLowerCase()]);
      if (!row) {
        return new NotFoundException(`Hashtag #${tag} not found`);
      }
      return new entities.HashtagEntity(row);
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async getPostsByHashtag(
    dto: dtos.GetHashtagFeedDTO
  ): Promise<BadException | { tag: string; posts_count: number; posts: any[]; pagination: any }> {
    try {
      const page = parseInt(dto.page ?? '1', 10);
      const limit = Math.min(parseInt(dto.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;
      const tag = dto.tag.toLowerCase();
      const userId = dto.user_id ?? null;

      const hashtag = await db.oneOrNone(HashtagsQuery.getHashtagByTag, [tag]);
      if (!hashtag) {
        return new BadException(`Hashtag #${tag} not found`);
      }

      const rows = await db.manyOrNone(HashtagsQuery.getPostsByHashtag, [offset, limit, tag, userId]);

      const count = rows.length > 0 ? parseInt(rows[0].count, 10) : 0;
      const posts = rows.map((r: any) => {
        const { count: _count, ...post } = r;
        return post;
      });

      return {
        tag,
        posts_count: hashtag.posts_count,
        posts,
        pagination: {
          page: String(page),
          limit: String(limit),
          total: count,
          totalPages: calcPages(count, String(limit)),
        },
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  private trendingCache: { data: entities.HashtagEntity[]; expiresAt: number } = { data: [], expiresAt: 0 };

  public async getTrendingHashtags(
    dto: dtos.TrendingHashtagsDTO
  ): Promise<BadException | entities.HashtagEntity[]> {
    try {
      const now = Date.now();
      if (this.trendingCache.expiresAt > now && this.trendingCache.data.length > 0) {
        return this.trendingCache.data;
      }

      const limit = Math.min(parseInt(dto.limit ?? '20', 10), 50);
      const rows = await db.manyOrNone(HashtagsQuery.getTrendingHashtags, [limit]);
      const hashtags = rows.map((r: any) => new entities.HashtagEntity(r));

      this.trendingCache = { data: hashtags, expiresAt: now + 5 * 60 * 1000 };
      return hashtags;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async searchHashtags(
    dto: dtos.SearchHashtagDTO
  ): Promise<BadException | { tag: string; posts_count: number }[]> {
    try {
      const rows = await db.manyOrNone(HashtagsQuery.searchHashtagsByPrefix, [dto.q.toLowerCase()]);
      return rows.map((r: any) => ({ tag: r.tag, posts_count: r.posts_count }));
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const hashtagsRepository = new HashtagsRepositoryImpl();

export default hashtagsRepository;
