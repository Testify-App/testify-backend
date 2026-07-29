import * as dtos from './dto';
import * as entities from './entities';
import NotificationsQuery from './query';
import { NotificationsInterface } from './interface';
import { db } from '../../config/database';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { calcPages, fetchResourceByPage, FetchPaginatedResponse } from '../../shared/helpers';

// Filter → notification types mapping (matches the UI filter panel)
const FILTER_TYPE_MAP: Record<string, string[]> = {
  mentions:        ['mention'],
  likes:           ['post_like', 'comment_like'],
  comments:        ['post_comment', 'comment_reply'],
  circle_requests: ['circle_request', 'circle_accepted', 'circle_removed'],
  follows:         ['follow'],
  moderation:      ['post_flagged', 'post_removed', 'post_approved'],
};

export class NotificationsRepositoryImpl implements NotificationsInterface {
  public async getNotifications(
    dto: dtos.GetNotificationsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id, filter } = dto as any;

      let typeFilter: string | null = null;
      if (filter && filter !== 'all' && FILTER_TYPE_MAP[filter]) {
        typeFilter = FILTER_TYPE_MAP[filter].join(',');
      }

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: NotificationsQuery.getNotifications,
        params: [user_id, typeFilter],
      });

      const unreadRow = await db.one(NotificationsQuery.getUnreadCount, [user_id]);
      const unread_count = parseInt(unreadRow.count, 10);

      const notifications = rows.map((row: any) =>
        new entities.NotificationWithActorEntity({
          id: row.id,
          user_id: row.user_id,
          type: row.type,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          data: row.data,
          is_read: row.is_read,
          read_at: row.read_at,
          created_at: row.created_at,
          actor: row.actor_id
            ? { id: row.actor_id, username: row.actor_username, avatar: row.actor_avatar }
            : undefined,
        })
      );

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        unread_count,
        notifications,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getUnreadCount(
    userId: string
  ): Promise<BadException | { count: number }> {
    try {
      const row = await db.one(NotificationsQuery.getUnreadCount, [userId]);
      return { count: parseInt(row.count, 10) };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async markAsRead(
    dto: dtos.NotificationIdDTO
  ): Promise<BadException | NotFoundException | entities.NotificationEntity> {
    try {
      const row = await db.oneOrNone(NotificationsQuery.markAsRead, [
        dto.notification_id,
        dto.user_id,
      ]);
      if (!row) {
        return new NotFoundException('Notification not found');
      }
      return new entities.NotificationEntity(row);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async markAllAsRead(
    userId: string
  ): Promise<BadException | { message: string }> {
    try {
      await db.none(NotificationsQuery.markAllAsRead, [userId]);
      return { message: 'All notifications marked as read' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async deleteNotification(
    dto: dtos.NotificationIdDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const existing = await db.oneOrNone(NotificationsQuery.getNotificationById, [
        dto.notification_id,
        dto.user_id,
      ]);
      if (!existing) {
        return new NotFoundException('Notification not found');
      }
      await db.none(NotificationsQuery.deleteNotification, [dto.notification_id, dto.user_id]);
      return { message: 'Notification deleted' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const NotificationsRepository = new NotificationsRepositoryImpl();
export default NotificationsRepository;
