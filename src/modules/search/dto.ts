import { BaseEntity } from '../../shared/utils/base-entity';

export class SearchQueryDTO extends BaseEntity<SearchQueryDTO> {
  q: string;
  page?: string;
  limit?: string;
}
