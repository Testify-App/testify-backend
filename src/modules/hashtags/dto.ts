import { BaseEntity } from '../../shared/utils/base-entity';

export class GetHashtagFeedDTO extends BaseEntity<GetHashtagFeedDTO> {
  tag: string;
  user_id?: string;
  page?: string;
  limit?: string;
}

export class SearchHashtagDTO extends BaseEntity<SearchHashtagDTO> {
  q: string;
}

export class TrendingHashtagsDTO extends BaseEntity<TrendingHashtagsDTO> {
  limit?: string;
}
