import http from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import Env from '../utils/env';
import Logger from '../../config/logger';
import jwtSigningService from '../services/jwt';
import { SignedData } from '../interface';
import presenceService from '../services/presence.redis';
import MessagingRepository from '../../modules/messaging/repositories';
import MessagingQuery from '../../modules/messaging/query';
import { db } from '../../config/database';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

const logger = new Logger('MessagingGateway');

let io: Server | undefined;

function userRoom(userId: string): string {
  return `user:${userId}`;
}

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

export function getMessagingIO(): Server | undefined {
  return io;
}

// Lets the REST send-message path (and any future server-side caller) push
// a socket event to a user without importing the gateway's internals.
export function emitToUser(userId: string, event: string, payload: any): void {
  io?.to(userRoom(userId)).emit(event, payload);
}

// Targets user rooms directly, one per participant, rather than the
// conversation room — a participant may not have called conversation:join
// (e.g. they're viewing their inbox, not this thread), but they're always
// in their own user room once connected.
export function emitToUsers(userIds: string[], event: string, payload: any): void {
  for (const userId of userIds) {
    io?.to(userRoom(userId)).emit(event, payload);
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  return presenceService.isOnline(userId);
}

export function initMessagingGateway(server: http.Server): Server {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  const pubClient = new Redis(Env.get<string>('REDIS_URL'), { maxRetriesPerRequest: null });
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    try {
      const token = (socket.handshake.auth?.token as string) || (socket.handshake.headers.authorization as string)?.split(' ')[1];
      if (!token) {
        return next(new Error('token not found.'));
      }
      const decoded = jwtSigningService.verify(token) as SignedData;
      (socket as AuthenticatedSocket).userId = decoded.id;
      return next();
    } catch {
      return next(new Error('invalid token.'));
    }
  });

  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId;

    socket.join(userRoom(userId));
    presenceService.markOnline(userId, socket.id).catch((err) => logger.error(err));
    io!.to(userRoom(userId)).emit('presence:update', { user_id: userId, online: true });

    const heartbeatInterval = setInterval(() => {
      presenceService.heartbeat(userId).catch((err) => logger.error(err));
    }, 30_000);

    socket.on('conversation:join', async (data: { conversation_id: string }) => {
      const conversationId = data?.conversation_id;
      if (!conversationId) return;
      const participant = await db.one(MessagingQuery.isParticipant, [conversationId, userId]).catch(() => ({ exists: false }));
      if (!participant.exists) return;
      socket.join(conversationRoom(conversationId));
    });

    socket.on('conversation:leave', (data: { conversation_id: string }) => {
      if (!data?.conversation_id) return;
      socket.leave(conversationRoom(data.conversation_id));
    });

    socket.on('message:send', async (data: {
      conversation_id: string;
      content_type: 'text' | 'image' | 'video' | 'audio';
      content?: string;
      media_url?: string;
      reply_to_message_id?: string;
    }, ack?: (response: any) => void) => {
      // sendMessage() itself emits `message:new` to the other participant's
      // user room once the DB write succeeds — this handler only needs to
      // return the result to the sender over the same socket call.
      const result = await MessagingRepository.sendMessage({
        user_id: userId,
        conversation_id: data?.conversation_id,
        content_type: data?.content_type,
        content: data?.content,
        media_url: data?.media_url,
        reply_to_message_id: data?.reply_to_message_id,
      } as any);

      ack?.(result);
    });

    socket.on('message:edit', async (data: { message_id: string; content: string }, ack?: (response: any) => void) => {
      // editMessage() emits `message:edited` to both participants' user rooms
      // once the DB write succeeds, same pattern as message:send.
      const result = await MessagingRepository.editMessage({
        user_id: userId,
        message_id: data?.message_id,
        content: data?.content,
      } as any);

      ack?.(result);
    });

    socket.on('message:react', async (data: { message_id: string; emoji: string }, ack?: (response: any) => void) => {
      const result = await MessagingRepository.reactToMessage({
        user_id: userId,
        message_id: data?.message_id,
        emoji: data?.emoji,
      } as any);

      ack?.(result);
    });

    socket.on('message:unreact', async (data: { message_id: string }, ack?: (response: any) => void) => {
      const result = await MessagingRepository.removeReaction({
        user_id: userId,
        message_id: data?.message_id,
      } as any);

      ack?.(result);
    });

    socket.on('message:unsend', async (data: { message_id: string }, ack?: (response: any) => void) => {
      const result = await MessagingRepository.unsendMessage({
        user_id: userId,
        message_id: data?.message_id,
      } as any);

      ack?.(result);
    });

    socket.on('message:read', async (data: { conversation_id: string; up_to_message_id: string }) => {
      const result = await MessagingRepository.markConversationRead({
        user_id: userId,
        conversation_id: data?.conversation_id,
        up_to_message_id: data?.up_to_message_id,
      } as any);
      if ('message' in (result as any)) {
        io!.to(conversationRoom(data.conversation_id)).emit('message:seen', {
          conversation_id: data.conversation_id,
          user_id: userId,
          up_to_message_id: data.up_to_message_id,
        });
      }
    });

    socket.on('typing:start', (data: { conversation_id: string }) => {
      if (!data?.conversation_id) return;
      presenceService.setTyping(data.conversation_id, userId).catch((err) => logger.error(err));
      socket.to(conversationRoom(data.conversation_id)).emit('typing:start', { conversation_id: data.conversation_id, user_id: userId });
    });

    socket.on('typing:stop', (data: { conversation_id: string }) => {
      if (!data?.conversation_id) return;
      presenceService.clearTyping(data.conversation_id, userId).catch((err) => logger.error(err));
      socket.to(conversationRoom(data.conversation_id)).emit('typing:stop', { conversation_id: data.conversation_id, user_id: userId });
    });

    socket.on('disconnect', () => {
      clearInterval(heartbeatInterval);
      presenceService.markOffline(userId, socket.id)
        .then(async () => {
          const stillOnline = await presenceService.isOnline(userId);
          if (!stillOnline) {
            io!.to(userRoom(userId)).emit('presence:update', { user_id: userId, online: false });
          }
        })
        .catch((err) => logger.error(err));
    });
  });

  return io;
}
