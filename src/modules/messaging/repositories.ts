import * as dtos from './dto';
import * as entities from './entities';
import MessagingQuery from './query';
import { MessagingInterface } from './interface';
import { db } from '../../config/database';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { calcPages, fetchResourceByPage, createNotification, FetchPaginatedResponse } from '../../shared/helpers';
import { isUserOnline, emitToUser } from '../../shared/sockets/messaging.gateway';

function mapMessageRow(m: any, reactions: entities.MessageReactionSummary[]): entities.MessageEntity {
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

export class MessagingRepositoryImpl implements MessagingInterface {
  public async getOrCreateConversation(
    payload: dtos.GetOrCreateConversationDTO
  ): Promise<BadException | { id: string }> {
    try {
      if (payload.user_id === payload.other_user_id) {
        return new BadException('You cannot message yourself');
      }

      const blocked = await db.one(MessagingQuery.isBlockedEitherDirection, [payload.user_id, payload.other_user_id]);
      if (blocked.exists) {
        return new BadException('You cannot message this user');
      }

      const existing = await db.oneOrNone(MessagingQuery.findDirectConversation, [payload.user_id, payload.other_user_id]);
      if (existing) {
        return { id: existing.id };
      }

      const result = await db.tx(async (t) => {
        const conversation = await t.one(MessagingQuery.createConversation);
        await t.none(MessagingQuery.addParticipant, [conversation.id, payload.user_id]);
        await t.none(MessagingQuery.addParticipant, [conversation.id, payload.other_user_id]);
        return conversation;
      });

      return { id: result.id };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getConversations(
    query: dtos.GetConversationsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id } = query as { page?: string; limit?: string; user_id: string };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: MessagingQuery.getConversations,
        params: [user_id],
      });

      const conversations = rows.map((row: any) => new entities.ConversationEntity({
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
        totalPages: calcPages(count, limit),
        conversations,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getMessages(
    query: dtos.GetMessagesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '30', user_id, conversation_id } = query as {
        page?: string; limit?: string; user_id: string; conversation_id: string;
      };

      const participant = await db.one(MessagingQuery.isParticipant, [conversation_id, user_id]);
      if (!participant.exists) {
        return new NotFoundException('Conversation not found');
      }

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: MessagingQuery.getMessages,
        params: [conversation_id],
      });

      const messageIds = rows.map((r: any) => r.id);
      const reactionRows = messageIds.length > 0
        ? await db.any(MessagingQuery.getReactionsForMessages, [messageIds, user_id])
        : [];

      const reactionsByMessage = new Map<string, entities.MessageReactionSummary[]>();
      for (const r of reactionRows) {
        const list = reactionsByMessage.get(r.message_id) || [];
        list.push(new entities.MessageReactionSummary({
          emoji: r.emoji,
          count: parseInt(r.count, 10),
          reacted_by_viewer: r.reacted_by_viewer,
        }));
        reactionsByMessage.set(r.message_id, list);
      }

      const messages = rows.map((m: any) => mapMessageRow(m, reactionsByMessage.get(m.id) || []));

      return {
        total: String(count),
        currentPage: page,
        totalPages: calcPages(count, limit),
        messages,
      };
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async sendMessage(
    payload: dtos.SendMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity> {
    try {
      const participant = await db.one(MessagingQuery.isParticipant, [payload.conversation_id, payload.user_id]);
      if (!participant.exists) {
        return new NotFoundException('Conversation not found');
      }

      const otherParticipant = await db.oneOrNone(MessagingQuery.getOtherParticipant, [payload.conversation_id, payload.user_id]);
      if (otherParticipant) {
        const blocked = await db.one(MessagingQuery.isBlockedEitherDirection, [payload.user_id, otherParticipant.user_id]);
        if (blocked.exists) {
          return new BadException('You cannot message this user');
        }
      }

      if (payload.reply_to_message_id) {
        const replyTarget = await db.oneOrNone(MessagingQuery.getMessageById, [payload.reply_to_message_id]);
        if (!replyTarget || replyTarget.conversation_id !== payload.conversation_id) {
          return new BadException('Message being replied to was not found in this conversation');
        }
      }

      const message = await db.tx(async (t) => {
        const created = await t.one(MessagingQuery.createMessage, [
          payload.conversation_id,
          payload.user_id,
          payload.reply_to_message_id || null,
          payload.content_type,
          payload.content || null,
          payload.media_url || null,
        ]);
        await t.none(MessagingQuery.updateConversationLastMessage, [payload.conversation_id, created.id]);
        return created;
      });

      const messageEntity = new entities.MessageEntity(message);

      if (otherParticipant) {
        emitToUser(otherParticipant.user_id, 'message:new', messageEntity);

        isUserOnline(otherParticipant.user_id)
          .then((online) => {
            if (online) return;
            return createNotification({
              user_id: otherParticipant.user_id,
              actor_id: payload.user_id,
              type: 'message',
              entity_type: 'conversation',
              entity_id: payload.conversation_id,
              data: { message_id: message.id },
            });
          })
          .catch(() => {});
      }

      return messageEntity;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async markConversationRead(
    payload: dtos.MarkConversationReadDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const participant = await db.one(MessagingQuery.isParticipant, [payload.conversation_id, payload.user_id]);
      if (!participant.exists) {
        return new NotFoundException('Conversation not found');
      }

      const targetMessage = await db.oneOrNone(MessagingQuery.getMessageById, [payload.up_to_message_id]);
      if (!targetMessage || targetMessage.conversation_id !== payload.conversation_id) {
        return new BadException('Message not found in this conversation');
      }

      await db.none(MessagingQuery.markConversationRead, [payload.conversation_id, payload.user_id, payload.up_to_message_id]);
      return { message: 'Conversation marked as read' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async unsendMessage(
    payload: dtos.UnsendMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const updated = await db.oneOrNone(MessagingQuery.unsendMessage, [payload.message_id, payload.user_id]);
      if (!updated) {
        return new NotFoundException('Message not found, already unsent, or you are not the sender');
      }
      return { message: 'Message unsent' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async reactToMessage(
    payload: dtos.ReactToMessageDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const target = await db.oneOrNone(MessagingQuery.getMessageById, [payload.message_id]);
      if (!target) {
        return new NotFoundException('Message not found');
      }
      const participant = await db.one(MessagingQuery.isParticipant, [target.conversation_id, payload.user_id]);
      if (!participant.exists) {
        return new NotFoundException('Message not found');
      }

      await db.none(MessagingQuery.addReaction, [payload.message_id, payload.user_id, payload.emoji]);
      return { message: 'Reaction added' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async removeReaction(
    payload: dtos.RemoveReactionDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const removed = await db.oneOrNone(MessagingQuery.removeReaction, [payload.message_id, payload.user_id]);
      if (!removed) {
        return new NotFoundException('Reaction not found');
      }
      return { message: 'Reaction removed' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const MessagingRepository = new MessagingRepositoryImpl();
export default MessagingRepository;
