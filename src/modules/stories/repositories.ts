import * as dtos from './dto';
import * as entities from './entities';
import StoriesQuery from './query';
import { StoriesInterface } from './interface';
import { db } from '../../config/database';
import { BadException, NotFoundException, ForbiddenException } from '../../shared/lib/errors';
import { calcPages, fetchResourceByPage, FetchPaginatedResponse, createNotification } from '../../shared/helpers';

function mapToEntity(row: any): entities.StoryEntity {
  return new entities.StoryEntity({
    id: row.id,
    user_id: row.user_id,
    content_type: row.content_type,
    media_url: row.media_url,
    thumbnail_url: row.thumbnail_url,
    text_content: row.text_content,
    background_style: row.background_style,
    duration: row.duration,
    views_count: Number(row.views_count ?? 0),
    is_viewed: row.is_viewed ?? undefined,
    created_at: row.created_at,
    expires_at: row.expires_at,
    author: {
      id: row.user_id,
      username: row.author_username,
      avatar: row.author_avatar,
      display_name: row.author_display_name,
    },
  });
}

export class StoriesRepositoryImpl implements StoriesInterface {
  public async createStory(
    payload: dtos.CreateStoryDTO
  ): Promise<BadException | entities.StoryEntity> {
    try {
      const created = await db.one(StoriesQuery.createStory, [
        payload.user_id,
        payload.content_type,
        payload.media_url || null,
        payload.thumbnail_url || null,
        payload.text_content || null,
        payload.background_style ? JSON.stringify(payload.background_style) : null,
        payload.duration ?? null,
      ]);

      const full = await db.one(StoriesQuery.getStoryById, [created.id]);

      const members = await db.manyOrNone(
        `SELECT connected_user_id AS user_id FROM user_connections WHERE user_id = $1 AND status = 'accepted'`,
        [payload.user_id]
      );
      await Promise.all(
        members.map((member: { user_id: string }) =>
          createNotification({
            user_id: member.user_id,
            actor_id: payload.user_id,
            type: 'story_posted',
            entity_type: 'story',
            entity_id: created.id,
          }).catch(() => {})
        )
      );

      return mapToEntity(full);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getCircleStories(
    payload: dtos.GetCircleStoriesDTO
  ): Promise<BadException | entities.UserStoriesGroupEntity[]> {
    try {
      const rows = await db.manyOrNone(StoriesQuery.getCircleStories, [payload.user_id]);

      const groups = new Map<string, entities.UserStoriesGroupEntity>();
      for (const row of rows) {
        if (!groups.has(row.user_id)) {
          groups.set(row.user_id, new entities.UserStoriesGroupEntity({
            user_id: row.user_id,
            author: {
              id: row.user_id,
              username: row.author_username,
              avatar: row.author_avatar,
              display_name: row.author_display_name,
            },
            has_unviewed: false,
            latest_created_at: row.user_latest_created_at,
            stories: [],
          }));
        }
        const group = groups.get(row.user_id)!;
        group.stories!.push(mapToEntity(row));
        if (!row.is_viewed) group.has_unviewed = true;
      }

      return Array.from(groups.values());
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getMyStories(
    payload: dtos.GetMyStoriesDTO
  ): Promise<BadException | entities.StoryEntity[]> {
    try {
      const rows = await db.manyOrNone(StoriesQuery.getMyStories, [payload.user_id]);
      return rows.map((row: any) => mapToEntity(row));
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getStory(
    payload: dtos.GetStoryDTO
  ): Promise<NotFoundException | ForbiddenException | entities.StoryEntity> {
    try {
      const story = await db.oneOrNone(StoriesQuery.getStoryById, [payload.story_id]);
      if (!story) return new NotFoundException('Story not found');

      if (story.user_id !== payload.user_id) {
        const inCircle = await db.one(StoriesQuery.isOwnerOrInCircle, [payload.user_id, story.user_id]);
        if (!inCircle.exists) {
          return new ForbiddenException('You are not in this user\'s Circle');
        }

        const recorded = await db.oneOrNone(StoriesQuery.recordView, [payload.story_id, payload.user_id]);
        if (recorded) {
          await db.none(StoriesQuery.incrementViewsCount, [payload.story_id]);
          story.views_count = Number(story.views_count ?? 0) + 1;
        }
      }

      return mapToEntity({ ...story, is_viewed: true });
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async deleteStory(
    payload: dtos.DeleteStoryDTO
  ): Promise<NotFoundException | void> {
    try {
      const deleted = await db.oneOrNone(StoriesQuery.deleteStory, [payload.story_id, payload.user_id]);
      if (!deleted) return new NotFoundException('Story not found or you are not the owner');
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async getStoryViewers(
    payload: dtos.GetStoryViewersDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const story = await db.oneOrNone(
        'SELECT id, user_id FROM stories WHERE id = $1 AND deleted_at IS NULL',
        [payload.story_id]
      );
      if (!story) return new NotFoundException('Story not found');
      if (story.user_id !== payload.user_id) {
        return new BadException('Only the story owner can view the viewer list');
      }

      const { page = '1', limit = '20', story_id } = payload as {
        page?: string;
        limit?: string;
        story_id: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: StoriesQuery.getStoryViewers,
        params: [story_id],
      });

      const viewers = rows.map((row: any) => new entities.StoryViewerEntity(row));

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        viewers,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const StoriesRepository = new StoriesRepositoryImpl();
export default StoriesRepository;
