import { BaseEntity } from '../../shared/utils/base-entity';

export class GetNotificationsQueryDTO extends BaseEntity<GetNotificationsQueryDTO> {
  user_id: string;
  page?: string;
  limit?: string;
  filter?: string | string[];
}

export class NotificationIdDTO extends BaseEntity<NotificationIdDTO> {
  user_id: string;
  notification_id: string;
}

export class GetNotificationPreferencesDTO extends BaseEntity<GetNotificationPreferencesDTO> {
  user_id: string;
}

export class UpdateNotificationPreferencesDTO extends BaseEntity<UpdateNotificationPreferencesDTO> {
  user_id: string;
  likes?: boolean;
  comments_replies?: boolean;
  mentions?: boolean;
  new_followers?: boolean;
  reposts?: boolean;
  circle_activity?: boolean;
}
