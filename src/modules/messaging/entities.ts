import { BaseEntity } from '../../shared/utils/base-entity';

export type ConversationType = 'direct';
export type MessageContentType = 'text' | 'image' | 'video' | 'audio';

export class ConversationEntity extends BaseEntity<ConversationEntity> {
  id?: string;
  type?: ConversationType;
  last_message_at?: Date | null;
  created_at?: Date;
  other_participant?: {
    id?: string;
    username?: string;
    display_name?: string;
    avatar?: string;
  };
  last_message?: {
    id?: string;
    content?: string | null;
    content_type?: MessageContentType;
    is_unsent?: boolean;
    sender_id?: string;
    created_at?: Date;
  } | null;
  unread_count?: number;
}

export class MessageReactionSummary extends BaseEntity<MessageReactionSummary> {
  emoji?: string;
  count?: number;
  reacted_by_viewer?: boolean;
}

export class MessageReactorEntity extends BaseEntity<MessageReactorEntity> {
  user_id?: string;
  username?: string;
  display_name?: string;
  avatar?: string;
  emoji?: string;
  created_at?: Date;
  is_viewer?: boolean;
}

export class MessageEntity extends BaseEntity<MessageEntity> {
  id?: string;
  conversation_id?: string;
  sender_id?: string;
  reply_to_message_id?: string | null;
  content_type?: MessageContentType;
  content?: string | null;
  media_url?: string | null;
  is_unsent?: boolean;
  edited_at?: Date | null;
  created_at?: Date;
  reply_to?: {
    id?: string;
    content?: string | null;
    content_type?: MessageContentType;
    sender_id?: string;
    is_unsent?: boolean;
  } | null;
  reactions?: MessageReactionSummary[];
}
