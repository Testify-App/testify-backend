import { firebaseMessaging } from '../../config/firebase';
import { FcmSendResult } from '../../types/firebase.types';
import { InternalServerErrorException } from '../lib/errors';

function buildPayload(
  title: string,
  body: string,
  data?: Record<string, string>,
  imageUrl?: string,
): { notification: admin.messaging.Notification; data?: Record<string, string> } {
  return {
    notification: { title, body, ...(imageUrl && { imageUrl }) },
    ...(data && { data }),
  };
}

// firebase-admin types are re-used via the imported messaging instance
import * as admin from 'firebase-admin';

class NotificationServiceImpl {
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<string> {
    try {
      const messageId = await firebaseMessaging.send({
        token,
        ...buildPayload(title, body, data, imageUrl),
      });
      return messageId;
    } catch (error) {
      throw new InternalServerErrorException(
        `FCM send failed: ${(error as Error).message}`,
      );
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<FcmSendResult> {
    if (!tokens.length) {
      return { successCount: 0, failureCount: 0, responses: [] };
    }

    try {
      const result = await firebaseMessaging.sendEachForMulticast({
        tokens,
        ...buildPayload(title, body, data, imageUrl),
      });

      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
        responses: result.responses.map((r) => ({
          success: r.success,
          messageId: r.messageId,
          error: r.error?.message,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `FCM multicast failed: ${(error as Error).message}`,
      );
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    imageUrl?: string,
  ): Promise<string> {
    try {
      const messageId = await firebaseMessaging.send({
        topic,
        ...buildPayload(title, body, data, imageUrl),
      });
      return messageId;
    } catch (error) {
      throw new InternalServerErrorException(
        `FCM topic send failed: ${(error as Error).message}`,
      );
    }
  }
}

const NotificationService = new NotificationServiceImpl();
export default NotificationService;
