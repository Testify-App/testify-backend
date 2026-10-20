import Redis from 'ioredis';
import Env from '../utils/env';

// Dedicated connection for presence bookkeeping, separate from the shared
// cache client in `redis.ts` and from the pub/sub pair used by the
// Socket.IO Redis adapter — each needs its own connection lifecycle.
const redisClient = new Redis(Env.get<string>('REDIS_URL'), {
  maxRetriesPerRequest: null,
});

const ONLINE_TTL_SECONDS = 60;

const onlineKey = (userId: string) => `presence:online:${userId}`;
const socketsKey = (userId: string) => `presence:sockets:${userId}`;
const typingKey = (conversationId: string, userId: string) => `presence:typing:${conversationId}:${userId}`;

export interface PresenceService {
  markOnline(userId: string, socketId: string): Promise<void>;
  markOffline(userId: string, socketId: string): Promise<void>;
  heartbeat(userId: string): Promise<void>;
  isOnline(userId: string): Promise<boolean>;
  setTyping(conversationId: string, userId: string): Promise<void>;
  clearTyping(conversationId: string, userId: string): Promise<void>;
}

export class RedisPresenceService implements PresenceService {
  // A user can have multiple open sockets (multiple tabs/devices). We track
  // the set of live socket ids per user so "online" only flips to false once
  // every one of them has disconnected, and refresh a short TTL on the
  // membership marker so a crashed process (no clean disconnect) still
  // self-heals instead of leaving a user stuck "online" forever.
  public async markOnline(userId: string, socketId: string): Promise<void> {
    await redisClient
      .multi()
      .sadd(socketsKey(userId), socketId)
      .set(onlineKey(userId), '1', 'EX', ONLINE_TTL_SECONDS)
      .exec();
  }

  public async markOffline(userId: string, socketId: string): Promise<void> {
    const remaining = await redisClient.srem(socketsKey(userId), socketId);
    const count = await redisClient.scard(socketsKey(userId));
    if (count === 0) {
      await redisClient.del(onlineKey(userId));
    }
    void remaining;
  }

  public async heartbeat(userId: string): Promise<void> {
    await redisClient.expire(onlineKey(userId), ONLINE_TTL_SECONDS);
  }

  public async isOnline(userId: string): Promise<boolean> {
    const value = await redisClient.get(onlineKey(userId));
    return value !== null;
  }

  public async setTyping(conversationId: string, userId: string): Promise<void> {
    await redisClient.set(typingKey(conversationId, userId), '1', 'EX', 8);
  }

  public async clearTyping(conversationId: string, userId: string): Promise<void> {
    await redisClient.del(typingKey(conversationId, userId));
  }
}

const presenceService = new RedisPresenceService();

export default presenceService;
