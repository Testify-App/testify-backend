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
exports.getMessagingIO = getMessagingIO;
exports.emitToUser = emitToUser;
exports.isUserOnline = isUserOnline;
exports.initMessagingGateway = initMessagingGateway;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("../utils/env"));
const logger_1 = __importDefault(require("../../config/logger"));
const jwt_1 = __importDefault(require("../services/jwt"));
const presence_redis_1 = __importDefault(require("../services/presence.redis"));
const repositories_1 = __importDefault(require("../../modules/messaging/repositories"));
const query_1 = __importDefault(require("../../modules/messaging/query"));
const database_1 = require("../../config/database");
const logger = new logger_1.default('MessagingGateway');
let io;
function userRoom(userId) {
    return `user:${userId}`;
}
function conversationRoom(conversationId) {
    return `conversation:${conversationId}`;
}
function getMessagingIO() {
    return io;
}
function emitToUser(userId, event, payload) {
    io === null || io === void 0 ? void 0 : io.to(userRoom(userId)).emit(event, payload);
}
function isUserOnline(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return presence_redis_1.default.isOnline(userId);
    });
}
function initMessagingGateway(server) {
    io = new socket_io_1.Server(server, {
        cors: { origin: '*' },
    });
    const pubClient = new ioredis_1.default(env_1.default.get('REDIS_URL'), { maxRetriesPerRequest: null });
    const subClient = pubClient.duplicate();
    io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
    io.use((socket, next) => {
        var _a, _b;
        try {
            const token = ((_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token) || ((_b = socket.handshake.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(' ')[1]);
            if (!token) {
                return next(new Error('token not found.'));
            }
            const decoded = jwt_1.default.verify(token);
            socket.userId = decoded.id;
            return next();
        }
        catch (_c) {
            return next(new Error('invalid token.'));
        }
    });
    io.on('connection', (rawSocket) => {
        const socket = rawSocket;
        const userId = socket.userId;
        socket.join(userRoom(userId));
        presence_redis_1.default.markOnline(userId, socket.id).catch((err) => logger.error(err));
        io.to(userRoom(userId)).emit('presence:update', { user_id: userId, online: true });
        const heartbeatInterval = setInterval(() => {
            presence_redis_1.default.heartbeat(userId).catch((err) => logger.error(err));
        }, 30000);
        socket.on('conversation:join', (data) => __awaiter(this, void 0, void 0, function* () {
            const conversationId = data === null || data === void 0 ? void 0 : data.conversation_id;
            if (!conversationId)
                return;
            const participant = yield database_1.db.one(query_1.default.isParticipant, [conversationId, userId]).catch(() => ({ exists: false }));
            if (!participant.exists)
                return;
            socket.join(conversationRoom(conversationId));
        }));
        socket.on('conversation:leave', (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.conversation_id))
                return;
            socket.leave(conversationRoom(data.conversation_id));
        });
        socket.on('message:send', (data, ack) => __awaiter(this, void 0, void 0, function* () {
            const result = yield repositories_1.default.sendMessage({
                user_id: userId,
                conversation_id: data === null || data === void 0 ? void 0 : data.conversation_id,
                content_type: data === null || data === void 0 ? void 0 : data.content_type,
                content: data === null || data === void 0 ? void 0 : data.content,
                media_url: data === null || data === void 0 ? void 0 : data.media_url,
                reply_to_message_id: data === null || data === void 0 ? void 0 : data.reply_to_message_id,
            });
            ack === null || ack === void 0 ? void 0 : ack(result);
        }));
        socket.on('message:read', (data) => __awaiter(this, void 0, void 0, function* () {
            const result = yield repositories_1.default.markConversationRead({
                user_id: userId,
                conversation_id: data === null || data === void 0 ? void 0 : data.conversation_id,
                up_to_message_id: data === null || data === void 0 ? void 0 : data.up_to_message_id,
            });
            if ('message' in result) {
                io.to(conversationRoom(data.conversation_id)).emit('message:seen', {
                    conversation_id: data.conversation_id,
                    user_id: userId,
                    up_to_message_id: data.up_to_message_id,
                });
            }
        }));
        socket.on('typing:start', (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.conversation_id))
                return;
            presence_redis_1.default.setTyping(data.conversation_id, userId).catch((err) => logger.error(err));
            socket.to(conversationRoom(data.conversation_id)).emit('typing:start', { conversation_id: data.conversation_id, user_id: userId });
        });
        socket.on('typing:stop', (data) => {
            if (!(data === null || data === void 0 ? void 0 : data.conversation_id))
                return;
            presence_redis_1.default.clearTyping(data.conversation_id, userId).catch((err) => logger.error(err));
            socket.to(conversationRoom(data.conversation_id)).emit('typing:stop', { conversation_id: data.conversation_id, user_id: userId });
        });
        socket.on('disconnect', () => {
            clearInterval(heartbeatInterval);
            presence_redis_1.default.markOffline(userId, socket.id)
                .then(() => __awaiter(this, void 0, void 0, function* () {
                const stillOnline = yield presence_redis_1.default.isOnline(userId);
                if (!stillOnline) {
                    io.to(userRoom(userId)).emit('presence:update', { user_id: userId, online: false });
                }
            }))
                .catch((err) => logger.error(err));
        });
    });
    return io;
}
//# sourceMappingURL=messaging.gateway.js.map