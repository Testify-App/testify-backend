import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import MessagingService from './services';
import { fnRequest } from '../../shared/types';
import { User } from '../../shared/interface';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException, NotFoundException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class MessagingController {
  public getOrCreateConversation: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetOrCreateConversationDTO(req.body);
    dto.user_id = req.user!.id;
    const response = await MessagingService.getOrCreateConversation(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Conversation ready', StatusCodes.OK, response);
  };

  public getConversations: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetConversationsQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    const response = await MessagingService.getConversations(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Conversations retrieved successfully', StatusCodes.OK, response);
  };

  public getMessages: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetMessagesQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.conversation_id = req.params.conversationId;
    const response = await MessagingService.getMessages(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Messages retrieved successfully', StatusCodes.OK, response);
  };

  public sendMessage: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.SendMessageDTO(req.body);
    dto.user_id = req.user!.id;
    dto.conversation_id = req.params.conversationId;
    const response = await MessagingService.sendMessage(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Message sent successfully', StatusCodes.CREATED, response);
  };

  public markConversationRead: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.MarkConversationReadDTO(req.body);
    dto.user_id = req.user!.id;
    dto.conversation_id = req.params.conversationId;
    const response = await MessagingService.markConversationRead(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Conversation marked as read', StatusCodes.OK, response);
  };

  public unsendMessage: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.UnsendMessageDTO({
      user_id: req.user!.id,
      message_id: req.params.messageId,
    });
    const response = await MessagingService.unsendMessage(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, null);
  };

  public reactToMessage: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ReactToMessageDTO(req.body);
    dto.user_id = req.user!.id;
    dto.message_id = req.params.messageId;
    const response = await MessagingService.reactToMessage(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, null);
  };

  public removeReaction: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.RemoveReactionDTO({
      user_id: req.user!.id,
      message_id: req.params.messageId,
    });
    const response = await MessagingService.removeReaction(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, null);
  };

  public getUnreadCount: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetUnreadCountDTO({ user_id: req.user!.id });
    const response = await MessagingService.getUnreadCount(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Unread count retrieved successfully', StatusCodes.OK, response);
  };

  public getReactors: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetReactorsQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    dto.message_id = req.params.messageId;
    const response = await MessagingService.getReactors(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Reactors retrieved successfully', StatusCodes.OK, response);
  };

  public editMessage: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.EditMessageDTO(req.body);
    dto.user_id = req.user!.id;
    dto.message_id = req.params.messageId;
    const response = await MessagingService.editMessage(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Message edited successfully', StatusCodes.OK, response);
  };

  public deleteConversation: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.DeleteConversationDTO({
      user_id: req.user!.id,
      conversation_id: req.params.conversationId,
    });
    const response = await MessagingService.deleteConversation(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, null);
  };

  public deleteMessage: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.DeleteMessageDTO({
      user_id: req.user!.id,
      message_id: req.params.messageId,
    });
    const response = await MessagingService.deleteMessage(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, response.code || StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, null);
  };
}

const messagingController = new MessagingController();
export default messagingController;
