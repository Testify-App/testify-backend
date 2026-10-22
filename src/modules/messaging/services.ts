import * as dtos from './dto';
import * as entities from './entities';
import { MessagingInterface } from './interface';
import MessagingRepository from './repositories';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export class MessagingServiceImpl implements MessagingInterface {
  public getOrCreateConversation = async (
    payload: dtos.GetOrCreateConversationDTO
  ): Promise<BadException | { id: string }> => {
    return await MessagingRepository.getOrCreateConversation(payload);
  };

  public getConversations = async (
    query: dtos.GetConversationsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> => {
    return await MessagingRepository.getConversations(query);
  };

  public getMessages = async (
    query: dtos.GetMessagesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> => {
    return await MessagingRepository.getMessages(query);
  };

  public sendMessage = async (
    payload: dtos.SendMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity> => {
    return await MessagingRepository.sendMessage(payload);
  };

  public markConversationRead = async (
    payload: dtos.MarkConversationReadDTO
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await MessagingRepository.markConversationRead(payload);
  };

  public unsendMessage = async (
    payload: dtos.UnsendMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await MessagingRepository.unsendMessage(payload);
  };

  public reactToMessage = async (
    payload: dtos.ReactToMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await MessagingRepository.reactToMessage(payload);
  };

  public removeReaction = async (
    payload: dtos.RemoveReactionDTO
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await MessagingRepository.removeReaction(payload);
  };

  public getUnreadCount = async (
    payload: dtos.GetUnreadCountDTO
  ): Promise<BadException | { unread_count: number }> => {
    return await MessagingRepository.getUnreadCount(payload);
  };

  public getReactors = async (
    query: dtos.GetReactorsQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> => {
    return await MessagingRepository.getReactors(query);
  };

  public editMessage = async (
    payload: dtos.EditMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity> => {
    return await MessagingRepository.editMessage(payload);
  };

  public deleteConversation = async (
    payload: dtos.DeleteConversationDTO
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await MessagingRepository.deleteConversation(payload);
  };

  public deleteMessage = async (
    payload: dtos.DeleteMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await MessagingRepository.deleteMessage(payload);
  };

  public getMessagingPrivacySetting = async (
    payload: dtos.GetMessagingPrivacySettingDTO
  ): Promise<BadException | entities.MessagingPrivacySettingEntity> => {
    return await MessagingRepository.getMessagingPrivacySetting(payload);
  };

  public updateMessagingPrivacySetting = async (
    payload: dtos.UpdateMessagingPrivacySettingDTO
  ): Promise<BadException | entities.MessagingPrivacySettingEntity> => {
    return await MessagingRepository.updateMessagingPrivacySetting(payload);
  };

  public getStoryReplySetting = async (
    payload: dtos.GetStoryReplySettingDTO
  ): Promise<BadException | entities.StoryReplySettingEntity> => {
    return await MessagingRepository.getStoryReplySetting(payload);
  };

  public updateStoryReplySetting = async (
    payload: dtos.UpdateStoryReplySettingDTO
  ): Promise<BadException | entities.StoryReplySettingEntity> => {
    return await MessagingRepository.updateStoryReplySetting(payload);
  };
}

const MessagingService = new MessagingServiceImpl();
export default MessagingService;
