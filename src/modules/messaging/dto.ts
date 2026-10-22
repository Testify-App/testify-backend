import { BaseEntity } from '../../shared/utils/base-entity';
import { MessageContentType } from './entities';

export class GetConversationsQueryDTO extends BaseEntity<GetConversationsQueryDTO> {
  user_id: string;
  page?: string;
  limit?: string;
  search?: string;
}

export class GetUnreadCountDTO extends BaseEntity<GetUnreadCountDTO> {
  user_id: string;
}

export class DeleteConversationDTO extends BaseEntity<DeleteConversationDTO> {
  user_id: string;
  conversation_id: string;
}

export class DeleteMessageDTO extends BaseEntity<DeleteMessageDTO> {
  user_id: string;
  message_id: string;
}

export class GetMessagingPrivacySettingDTO extends BaseEntity<GetMessagingPrivacySettingDTO> {
  user_id: string;
}

export class UpdateMessagingPrivacySettingDTO extends BaseEntity<UpdateMessagingPrivacySettingDTO> {
  user_id: string;
  who_can_message: 'everyone' | 'following' | 'nobody';
}

export class GetStoryReplySettingDTO extends BaseEntity<GetStoryReplySettingDTO> {
  user_id: string;
}

export class UpdateStoryReplySettingDTO extends BaseEntity<UpdateStoryReplySettingDTO> {
  user_id: string;
  who_can_reply: 'everyone' | 'circle_only' | 'nobody';
}

export class GetOrCreateConversationDTO extends BaseEntity<GetOrCreateConversationDTO> {
  user_id: string;
  other_user_id: string;
}

export class GetMessagesQueryDTO extends BaseEntity<GetMessagesQueryDTO> {
  user_id: string;
  conversation_id: string;
  page?: string;
  limit?: string;
}

export class SendMessageDTO extends BaseEntity<SendMessageDTO> {
  user_id: string;
  // Optional only when quoted_story_id is set — the conversation is then
  // resolved from the story's author instead of a client-supplied id.
  conversation_id?: string;
  content_type: MessageContentType;
  content?: string;
  media_url?: string;
  reply_to_message_id?: string;
  quoted_story_id?: string;
}

export class MarkConversationReadDTO extends BaseEntity<MarkConversationReadDTO> {
  user_id: string;
  conversation_id: string;
  up_to_message_id: string;
}

export class UnsendMessageDTO extends BaseEntity<UnsendMessageDTO> {
  user_id: string;
  message_id: string;
}

export class ReactToMessageDTO extends BaseEntity<ReactToMessageDTO> {
  user_id: string;
  message_id: string;
  emoji: string;
}

export class RemoveReactionDTO extends BaseEntity<RemoveReactionDTO> {
  user_id: string;
  message_id: string;
}

export class GetReactorsQueryDTO extends BaseEntity<GetReactorsQueryDTO> {
  user_id: string;
  message_id: string;
  page?: string;
  limit?: string;
}

export class EditMessageDTO extends BaseEntity<EditMessageDTO> {
  user_id: string;
  message_id: string;
  content: string;
}
