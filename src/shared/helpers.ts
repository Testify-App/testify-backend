import { ITask } from 'pg-promise';
import { db } from '../config/database';
import { BaseEntity } from './utils/base-entity';
import query from '../modules/authentication/query';

interface FetchResourceParams {
  page: string;
  limit: string | 'none';
  getResources: any;
  params?: any[];
}

export const fetchResourceByPage = async ({
  page,
  limit,
  getResources,
  params = [],
}: FetchResourceParams): Promise<[any, any]> => {
  const offSet = limit === 'none' ? 0 : (+page - 1) * +limit;
  const max = limit === 'none' ? null : +limit;
  const results = await db.any(getResources, [offSet, max, ...params]);
  const count = results.length > 0 ? parseInt(results[0].count, 10) : 0;
  return [{ count }, results];
};

export const calcPages = (total: any, limit: any) => Math.ceil(total / +limit);

export class FetchPaginatedResponse extends BaseEntity<FetchPaginatedResponse> {
  total: string;
  currentPage: string;
  totalPages: number;
  [key: string]: any;
}

export const setLastLoginTime = async (
  payload: Array<string>,
  operation: 'backoffice' | 'user',
  t: ITask<any>
) => {
  operation === 'backoffice'
    ? await t.none(query.setBackofficeLastLoginTime, [...payload])
    : await t.none(query.setUserLastLoginTime, [...payload]);
};
