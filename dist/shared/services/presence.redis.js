"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisPresenceService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("../utils/env"));
const redisClient = new ioredis_1.default(env_1.default.get('REDIS_URL'), {
    maxRetriesPerRequest: null,
});
const ONLINE_TTL_SECONDS = 60;
const onlineKey = (userId) => `presence:online:${userId}`;
const socketsKey = (userId) => `presence:sockets:${userId}`;
const typingKey = (conversationId, userId) => `presence:typing:${conversationId}:${userId}`;
class RedisPresenceService {
    markOnline(userId, socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redisClient
                .multi()
                .sadd(socketsKey(userId), socketId)
                .set(onlineKey(userId), '1', 'EX', ONLINE_TTL_SECONDS)
                .exec();
        });
    }
    markOffline(userId, socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const remaining = yield redisClient.srem(socketsKey(userId), socketId);
            const count = yield redisClient.scard(socketsKey(userId));
            if (count === 0) {
                yield redisClient.del(onlineKey(userId));
            }
            void remaining;
        });
    }
    heartbeat(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redisClient.expire(onlineKey(userId), ONLINE_TTL_SECONDS);
        });
    }
    isOnline(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield redisClient.get(onlineKey(userId));
            return value !== null;
        });
    }
    setTyping(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redisClient.set(typingKey(conversationId, userId), '1', 'EX', 8);
        });
    }
    clearTyping(conversationId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield redisClient.del(typingKey(conversationId, userId));
        });
    }
}
exports.RedisPresenceService = RedisPresenceService;
const presenceService = new RedisPresenceService();
exports.default = presenceService;
//# sourceMappingURL=presence.redis.js.map