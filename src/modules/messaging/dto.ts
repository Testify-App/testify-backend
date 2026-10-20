import { BaseEntity } from '../../shared/utils/base-entity';
import { MessageContentType } from './entities';

export class GetConversationsQueryDTO extends BaseEntity<GetConversationsQueryDTO> {
  user_id: string;
  page?: string;
  limit?: string;
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
  conversation_id: string;
  content_type: MessageContentType;
  content?: string;
  media_url?: string;
  reply_to_message_id?: string;
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
