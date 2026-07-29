import * as dtos from './dto';
import * as entities from './entities';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export interface NotificationsInterface {
  getNotifications(dto: dtos.GetNotificationsQueryDTO): Promise<BadException | FetchPaginatedResponse>;
  getUnreadCount(userId: string): Promise<BadException | { count: number }>;
  markAsRead(dto: dtos.NotificationIdDTO): Promise<BadException | NotFoundException | entities.NotificationEntity>;
  markAllAsRead(userId: string): Promise<BadException | { message: string }>;
  deleteNotification(dto: dtos.NotificationIdDTO): Promise<BadException | NotFoundException | { message: string }>;
}
