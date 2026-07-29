import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import NotificationsService from './services';
import { fnRequest } from '../../shared/types';
import { User } from '../../shared/interface';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException, NotFoundException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class NotificationsController {
  public getNotifications: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.GetNotificationsQueryDTO(req.query as any);
    dto.user_id = req.user!.id;
    const response = await NotificationsService.getNotifications(dto);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Notifications retrieved successfully', StatusCodes.OK, response);
  };

  public getUnreadCount: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const response = await NotificationsService.getUnreadCount(req.user!.id);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Unread count retrieved successfully', StatusCodes.OK, response);
  };

  public markAsRead: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.NotificationIdDTO({
      user_id: req.user!.id,
      notification_id: req.params.notificationId,
    });
    const response = await NotificationsService.markAsRead(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Notification marked as read', StatusCodes.OK, response);
  };

  public markAllAsRead: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const response = await NotificationsService.markAllAsRead(req.user!.id);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'All notifications marked as read', StatusCodes.OK, response);
  };

  public deleteNotification: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.NotificationIdDTO({
      user_id: req.user!.id,
      notification_id: req.params.notificationId,
    });
    const response = await NotificationsService.deleteNotification(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Notification deleted', StatusCodes.OK, null);
  };
}

const notificationsController = new NotificationsController();
export default notificationsController;
