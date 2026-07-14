import * as dtos from './dto';
import SearchRepository from './repositories';
import { BadException } from '../../shared/lib/errors';

export class SearchServiceImpl {
  public search = async (
    dto: dtos.SearchQueryDTO
  ): Promise<BadException | object> => {
    return await SearchRepository.search(dto);
  };
}

const SearchService = new SearchServiceImpl();
export default SearchService;
