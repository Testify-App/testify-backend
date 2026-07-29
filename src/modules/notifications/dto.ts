import { BaseEntity } from '../../shared/utils/base-entity';

export class GetNotificationsQueryDTO extends BaseEntity<GetNotificationsQueryDTO> {
  user_id: string;
  page?: string;
  limit?: string;
  filter?: string;
}

export class NotificationIdDTO extends BaseEntity<NotificationIdDTO> {
  user_id: string;
  notification_id: string;
}
