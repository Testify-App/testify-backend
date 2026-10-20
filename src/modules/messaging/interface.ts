import * as dtos from './dto';
import * as entities from './entities';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export interface MessagingInterface {
  getOrCreateConversation(
    payload: dtos.GetOrCreateConversationDTO
  ): Promise<BadException | { id: string }>;

  getConversations(
    query: dtos.GetConversationsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse>;

  getMessages(
    query: dtos.GetMessagesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse>;

  sendMessage(
    payload: dtos.SendMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity>;

  markConversationRead(
    payload: dtos.MarkConversationReadDTO
  ): Promise<BadException | NotFoundException | { message: string }>;

  unsendMessage(
    payload: dtos.UnsendMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }>;

  reactToMessage(
    payload: dtos.ReactToMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }>;

  removeReaction(
    payload: dtos.RemoveReactionDTO
  ): Promise<BadException | NotFoundException | { message: string }>;
}
