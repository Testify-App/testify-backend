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

  getUnreadCount(
    payload: dtos.GetUnreadCountDTO
  ): Promise<BadException | { unread_count: number }>;

  getReactors(
    query: dtos.GetReactorsQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse>;

  editMessage(
    payload: dtos.EditMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity>;

  deleteConversation(
    payload: dtos.DeleteConversationDTO
  ): Promise<BadException | NotFoundException | { message: string }>;

  deleteMessage(
    payload: dtos.DeleteMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }>;
}
