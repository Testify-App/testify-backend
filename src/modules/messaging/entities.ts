import { BaseEntity } from '../../shared/utils/base-entity';

export type ConversationType = 'direct';
export type MessageContentType = 'text' | 'image' | 'video' | 'audio';
export type MessagingPrivacyOption = 'everyone' | 'following' | 'nobody';
export type StoryReplyOption = 'everyone' | 'circle_only' | 'nobody';
export type MessageRestrictionReason = 'blocked' | 'recipient_not_accepting_messages' | 'account_unavailable';

export class ConversationEntity extends BaseEntity<ConversationEntity> {
  id?: string;
  type?: ConversationType;
  last_message_at?: Date | null;
  created_at?: Date;
  other_participant?: {
    id?: string;
    username?: string | null;
    display_name?: string | null;
    avatar?: string | null;
    is_account_available?: boolean;
    is_account_deleted?: boolean;
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
  can_send_message?: boolean;
  restriction_reason?: MessageRestrictionReason | null;
}

export class MessagingPrivacySettingEntity extends BaseEntity<MessagingPrivacySettingEntity> {
  who_can_message?: MessagingPrivacyOption;
  updated_at?: Date;
}

export class StoryReplySettingEntity extends BaseEntity<StoryReplySettingEntity> {
  who_can_reply?: StoryReplyOption;
  updated_at?: Date;
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
  quoted_story_id?: string | null;
  quoted_story_snapshot?: {
    content_type?: string;
    media_url?: string | null;
    thumbnail_url?: string | null;
    text_content?: string | null;
    background_style?: Record<string, any> | null;
    author_id?: string;
    author_username?: string;
    author_display_name?: string;
    story_created_at?: Date;
  } | null;
  reactions?: MessageReactionSummary[];
}
