import { ITask } from 'pg-promise';
import { db } from '../config/database';
import { BaseEntity } from './utils/base-entity';
import query from '../modules/authentication/query';

export interface ContentSegment {
  type: 'text' | 'mention' | 'hashtag';
  value: string;
  user_id?: string;
}

export const parseContentSegments = async (content: string): Promise<ContentSegment[]> => {
  if (!content) return [];

  const tokenRegex = /(@[a-zA-Z0-9_]+|#[a-zA-Z0-9]+)/g;
  const parts = content.split(tokenRegex);

  const mentionUsernames = parts
    .filter(p => p.startsWith('@'))
    .map(p => p.substring(1));

  const userMap = new Map<string, string>();
  if (mentionUsernames.length > 0) {
    const users: Array<{ id: string; username: string }> = await db.manyOrNone(
      'SELECT id, username FROM users WHERE username = ANY($1::text[])',
      [mentionUsernames]
    );
    for (const u of users) {
      userMap.set(u.username.toLowerCase(), u.id);
    }
  }

  const segments: ContentSegment[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('@')) {
      const username = part.substring(1);
      segments.push({ type: 'mention', value: part, user_id: userMap.get(username.toLowerCase()) });
    } else if (part.startsWith('#')) {
      segments.push({ type: 'hashtag', value: part });
    } else if (part.trim()) {
      segments.push({ type: 'text', value: part });
    }
  }
  return segments;
};

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
