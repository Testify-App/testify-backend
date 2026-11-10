import { db } from '../../../config/database';
import { fetchResourceByPage } from '../../../shared/helpers';
import { writeAudit } from '../shared/lib/audit';
import { ModeratedContentType, restoreContent } from '../shared/lib/content-moderation';
import { BadException, HttpException } from '../shared/lib/errors';
import { ActorContext } from '../shared/lib/request-context';
import HiddenContentQuery from './query';

const parseMedia = (value: unknown) => {
  const list = typeof value === 'string' ? JSON.parse(value) : value;
  return Array.isArray(list) ? list.filter((item: any) => item && typeof item.url === 'string') : [];
};

export class HiddenContentRepositoryImpl {
  public async fetchHidden(query: {
    type: ModeratedContentType; page: string; limit: string; search?: string; from?: string; to?: string;
  }): Promise<[any, any[], { posts: number; comments: number }]> {
    const [[meta, rows], counts] = await Promise.all([
      fetchResourceByPage({
        page: query.page,
        limit: query.limit,
        getResources: HiddenContentQuery.fetchHidden,
        params: [query.type, query.search ?? '', query.from ?? null, query.to ?? null],
      }),
      db.one(HiddenContentQuery.counts),
    ]);
    return [meta, rows.map((row: any) => ({
      type: row.type,
      id: row.id,
      post_id: row.post_id,
      content: row.content,
      media: parseMedia(row.media),
      posted_at: row.posted_at,
      hidden_at: row.hidden_at,
      hidden_reason: row.hidden_reason,
      report_id: row.hidden_report_id,
      author: {
        id: row.author_id, username: row.author_username, display_name: row.author_display_name, avatar: row.author_avatar,
      },
      hidden_by: row.hidden_by_id ? { id: row.hidden_by_id, name: row.hidden_by_name ?? '' } : null,
      parent_post_content: row.parent_post_content,
    })), counts];
  };

  public async restore(
    type: ModeratedContentType, id: string, note: string | undefined, actor: ActorContext,
  ): Promise<HttpException | { id: string; type: ModeratedContentType }> {
    try {
      await db.tx(async (t) => {
        const restored = await restoreContent(t, { type, id });
        await writeAudit(t, {
          actorId: actor.adminId,
          action: `${type}:restore`,
          module: 'hidden_content',
          entityType: type,
          entityReference: id,
          before: { hidden_reason: restored.hiddenReason },
          after: { restored: true, reason: note?.trim() || 'Restored after review', preview: restored.preview },
          ip: actor.ip,
        });
      });
      return { id, type };
    } catch (error) {
      if (error instanceof HttpException) return error;
      return new BadException(`${error.message}`);
    }
  };
}

const hiddenContentRepository = new HiddenContentRepositoryImpl();

export default hiddenContentRepository;
