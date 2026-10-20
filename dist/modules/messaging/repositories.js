"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.MessagingRepositoryImpl = void 0;
const entities = __importStar(require("./entities"));
const query_1 = __importDefault(require("./query"));
const database_1 = require("../../config/database");
const errors_1 = require("../../shared/lib/errors");
const helpers_1 = require("../../shared/helpers");
const messaging_gateway_1 = require("../../shared/sockets/messaging.gateway");
function mapMessageRow(m, reactions) {
    return new entities.MessageEntity({
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        reply_to_message_id: m.reply_to_message_id,
        content_type: m.content_type,
        content: m.content,
        media_url: m.media_url,
        is_unsent: m.is_unsent,
        created_at: m.created_at,
        reply_to: m.reply_to_id
            ? {
                id: m.reply_to_id,
                content: m.reply_to_content,
                content_type: m.reply_to_content_type,
                sender_id: m.reply_to_sender_id,
                is_unsent: m.reply_to_is_unsent,
            }
            : null,
        reactions,
    });
}
class MessagingRepositoryImpl {
    getOrCreateConversation(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (payload.user_id === payload.other_user_id) {
                    return new errors_1.BadException('You cannot message yourself');
                }
                const blocked = yield database_1.db.one(query_1.default.isBlockedEitherDirection, [payload.user_id, payload.other_user_id]);
                if (blocked.exists) {
                    return new errors_1.BadException('You cannot message this user');
                }
                const existing = yield database_1.db.oneOrNone(query_1.default.findDirectConversation, [payload.user_id, payload.other_user_id]);
                if (existing) {
                    return { id: existing.id };
                }
                const result = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const conversation = yield t.one(query_1.default.createConversation);
                    yield t.none(query_1.default.addParticipant, [conversation.id, payload.user_id]);
                    yield t.none(query_1.default.addParticipant, [conversation.id, payload.other_user_id]);
                    return conversation;
                }));
                return { id: result.id };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getConversations(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '20', user_id } = query;
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getConversations,
                    params: [user_id],
                });
                const conversations = rows.map((row) => new entities.ConversationEntity({
                    id: row.id,
                    type: row.type,
                    last_message_at: row.last_message_at,
                    created_at: row.created_at,
                    other_participant: {
                        id: row.other_user_id,
                        username: row.other_username,
                        display_name: row.other_display_name,
                        avatar: row.other_avatar,
                    },
                    last_message: row.last_message_id
                        ? {
                            id: row.last_message_id,
                            content: row.last_message_is_unsent ? null : row.last_message_content,
                            content_type: row.last_message_content_type,
                            is_unsent: row.last_message_is_unsent,
                            sender_id: row.last_message_sender_id,
                            created_at: row.last_message_created_at,
                        }
                        : null,
                    unread_count: parseInt(row.unread_count || '0', 10),
                }));
                return {
                    total: String(count),
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    conversations,
                };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    getMessages(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = '1', limit = '30', user_id, conversation_id } = query;
                const participant = yield database_1.db.one(query_1.default.isParticipant, [conversation_id, user_id]);
                if (!participant.exists) {
                    return new errors_1.NotFoundException('Conversation not found');
                }
                const [{ count }, rows] = yield (0, helpers_1.fetchResourceByPage)({
                    page,
                    limit,
                    getResources: query_1.default.getMessages,
                    params: [conversation_id],
                });
                const messageIds = rows.map((r) => r.id);
                const reactionRows = messageIds.length > 0
                    ? yield database_1.db.any(query_1.default.getReactionsForMessages, [messageIds, user_id])
                    : [];
                const reactionsByMessage = new Map();
                for (const r of reactionRows) {
                    const list = reactionsByMessage.get(r.message_id) || [];
                    list.push(new entities.MessageReactionSummary({
                        emoji: r.emoji,
                        count: parseInt(r.count, 10),
                        reacted_by_viewer: r.reacted_by_viewer,
                    }));
                    reactionsByMessage.set(r.message_id, list);
                }
                const messages = rows.map((m) => mapMessageRow(m, reactionsByMessage.get(m.id) || []));
                return {
                    total: String(count),
                    currentPage: page,
                    totalPages: (0, helpers_1.calcPages)(count, limit),
                    messages,
                };
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    sendMessage(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const participant = yield database_1.db.one(query_1.default.isParticipant, [payload.conversation_id, payload.user_id]);
                if (!participant.exists) {
                    return new errors_1.NotFoundException('Conversation not found');
                }
                const otherParticipant = yield database_1.db.oneOrNone(query_1.default.getOtherParticipant, [payload.conversation_id, payload.user_id]);
                if (otherParticipant) {
                    const blocked = yield database_1.db.one(query_1.default.isBlockedEitherDirection, [payload.user_id, otherParticipant.user_id]);
                    if (blocked.exists) {
                        return new errors_1.BadException('You cannot message this user');
                    }
                }
                if (payload.reply_to_message_id) {
                    const replyTarget = yield database_1.db.oneOrNone(query_1.default.getMessageById, [payload.reply_to_message_id]);
                    if (!replyTarget || replyTarget.conversation_id !== payload.conversation_id) {
                        return new errors_1.BadException('Message being replied to was not found in this conversation');
                    }
                }
                const message = yield database_1.db.tx((t) => __awaiter(this, void 0, void 0, function* () {
                    const created = yield t.one(query_1.default.createMessage, [
                        payload.conversation_id,
                        payload.user_id,
                        payload.reply_to_message_id || null,
                        payload.content_type,
                        payload.content || null,
                        payload.media_url || null,
                    ]);
                    yield t.none(query_1.default.updateConversationLastMessage, [payload.conversation_id, created.id]);
                    return created;
                }));
                const messageEntity = new entities.MessageEntity(message);
                if (otherParticipant) {
                    (0, messaging_gateway_1.emitToUser)(otherParticipant.user_id, 'message:new', messageEntity);
                    (0, messaging_gateway_1.isUserOnline)(otherParticipant.user_id)
                        .then((online) => {
                        if (online)
                            return;
                        return (0, helpers_1.createNotification)({
                            user_id: otherParticipant.user_id,
                            actor_id: payload.user_id,
                            type: 'message',
                            entity_type: 'conversation',
                            entity_id: payload.conversation_id,
                            data: { message_id: message.id },
                        });
                    })
                        .catch(() => { });
                }
                return messageEntity;
            }
            catch (error) {
                return new errors_1.NotFoundException(`${error.message}`);
            }
        });
    }
    markConversationRead(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const participant = yield database_1.db.one(query_1.default.isParticipant, [payload.conversation_id, payload.user_id]);
                if (!participant.exists) {
                    return new errors_1.NotFoundException('Conversation not found');
                }
                const targetMessage = yield database_1.db.oneOrNone(query_1.default.getMessageById, [payload.up_to_message_id]);
                if (!targetMessage || targetMessage.conversation_id !== payload.conversation_id) {
                    return new errors_1.BadException('Message not found in this conversation');
                }
                yield database_1.db.none(query_1.default.markConversationRead, [payload.conversation_id, payload.user_id, payload.up_to_message_id]);
                return { message: 'Conversation marked as read' };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    unsendMessage(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updated = yield database_1.db.oneOrNone(query_1.default.unsendMessage, [payload.message_id, payload.user_id]);
                if (!updated) {
                    return new errors_1.NotFoundException('Message not found, already unsent, or you are not the sender');
                }
                return { message: 'Message unsent' };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    reactToMessage(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const target = yield database_1.db.oneOrNone(query_1.default.getMessageById, [payload.message_id]);
                if (!target) {
                    return new errors_1.NotFoundException('Message not found');
                }
                const participant = yield database_1.db.one(query_1.default.isParticipant, [target.conversation_id, payload.user_id]);
                if (!participant.exists) {
                    return new errors_1.NotFoundException('Message not found');
                }
                yield database_1.db.none(query_1.default.addReaction, [payload.message_id, payload.user_id, payload.emoji]);
                return { message: 'Reaction added' };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
    removeReaction(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const removed = yield database_1.db.oneOrNone(query_1.default.removeReaction, [payload.message_id, payload.user_id]);
                if (!removed) {
                    return new errors_1.NotFoundException('Reaction not found');
                }
                return { message: 'Reaction removed' };
            }
            catch (error) {
                return new errors_1.BadException(`${error.message}`);
            }
        });
    }
}
exports.MessagingRepositoryImpl = MessagingRepositoryImpl;
const MessagingRepository = new MessagingRepositoryImpl();
exports.default = MessagingRepository;
//# sourceMappingURL=repositories.js.map