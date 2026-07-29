import * as dtos from './dto';
import * as entities from './entities';
import NotificationsRepository from './repositories';
import { NotificationsInterface } from './interface';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export class NotificationsServiceImpl implements NotificationsInterface {
  public async getNotifications(
    dto: dtos.GetNotificationsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    return NotificationsRepository.getNotifications(dto);
  }

  public async getUnreadCount(
    userId: string
  ): Promise<BadException | { count: number }> {
    return NotificationsRepository.getUnreadCount(userId);
  }

  public async markAsRead(
    dto: dtos.NotificationIdDTO
  ): Promise<BadException | NotFoundException | entities.NotificationEntity> {
    return NotificationsRepository.markAsRead(dto);
  }

  public async markAllAsRead(
    userId: string
  ): Promise<BadException | { message: string }> {
    return NotificationsRepository.markAllAsRead(userId);
  }

  public async deleteNotification(
    dto: dtos.NotificationIdDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    return NotificationsRepository.deleteNotification(dto);
  }
}

const NotificationsService = new NotificationsServiceImpl();
export default NotificationsService;
