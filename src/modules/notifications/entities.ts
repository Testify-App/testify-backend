import { BaseEntity } from '../../shared/utils/base-entity';

export type NotificationType =
  | 'post_like'
  | 'comment_like'
  | 'post_comment'
  | 'comment_reply'
  | 'mention'
  | 'repost'
  | 'follow'
  | 'circle_request'
  | 'circle_accepted'
  | 'circle_removed'
  | 'post_flagged'
  | 'post_removed'
  | 'post_approved';

export type NotificationEntityType = 'post' | 'comment' | 'user' | null;

export interface NotificationData {
  actor_username?: string;
  actor_avatar?: string;
  post_snippet?: string;
  post_thumbnail?: string;
  [key: string]: any;
}

export class NotificationEntity extends BaseEntity<NotificationEntity> {
  id?: string;
  user_id?: string;
  actor_id?: string;
  type?: NotificationType;
  entity_type?: NotificationEntityType;
  entity_id?: string;
  data?: NotificationData;
  is_read?: boolean;
  read_at?: Date | null;
  created_at?: Date;
}

export class NotificationWithActorEntity extends BaseEntity<NotificationWithActorEntity> {
  id?: string;
  user_id?: string;
  type?: NotificationType;
  entity_type?: NotificationEntityType;
  entity_id?: string;
  data?: NotificationData;
  is_read?: boolean;
  read_at?: Date | null;
  created_at?: Date;
  actor?: {
    id?: string;
    username?: string;
    avatar?: string;
  };
}
