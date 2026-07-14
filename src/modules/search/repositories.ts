import * as dtos from './dto';
import SearchQuery from './query';
import { db } from '../../config/database';
import { BadException } from '../../shared/lib/errors';
import { calcPages } from '../../shared/helpers';

export class SearchRepositoryImpl {
  public async search(
    dto: dtos.SearchQueryDTO
  ): Promise<BadException | {
    posts: { results: any[]; total: number; totalPages: number };
    profiles: { results: any[]; total: number; totalPages: number };
    hashtags: { tag: string; posts_count: number }[];
    query: string;
    page: string;
    limit: string;
  }> {
    try {
      const page = parseInt(dto.page ?? '1', 10);
      const limit = Math.min(parseInt(dto.limit ?? '20', 10), 100);
      const offset = (page - 1) * limit;
      const q = dto.q.trim();

      const [postRows, profileRows, hashtagRows] = await Promise.all([
        db.manyOrNone(SearchQuery.searchPosts, [offset, limit, q]),
        db.manyOrNone(SearchQuery.searchProfiles, [offset, limit, q]),
        db.manyOrNone(SearchQuery.searchHashtags, [q]),
      ]);

      const postCount = postRows.length > 0 ? parseInt(postRows[0].count, 10) : 0;
      const profileCount = profileRows.length > 0 ? parseInt(profileRows[0].count, 10) : 0;

      const posts = postRows.map(({ count: _c, rank: _r, ...row }) => row);
      const profiles = profileRows.map(({ count: _c, rank: _r, ...row }) => row);

      return {
        query: q,
        page: String(page),
        limit: String(limit),
        posts: {
          results: posts,
          total: postCount,
          totalPages: calcPages(postCount, String(limit)),
        },
        profiles: {
          results: profiles,
          total: profileCount,
          totalPages: calcPages(profileCount, String(limit)),
        },
        hashtags: hashtagRows,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const SearchRepository = new SearchRepositoryImpl();
export default SearchRepository;
