import * as dtos from './dto';
import * as entities from './entities';
import MessagingQuery from './query';
import { MessagingInterface } from './interface';
import { db } from '../../config/database';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { calcPages, fetchResourceByPage, createNotification, FetchPaginatedResponse } from '../../shared/helpers';
import { isUserOnline, emitToUser, emitToUsers } from '../../shared/sockets/messaging.gateway';

function mapReactorRow(r: any): entities.MessageReactorEntity {
  return new entities.MessageReactorEntity({
    user_id: r.user_id,
    username: r.username,
    display_name: r.display_name,
    avatar: r.avatar,
    emoji: r.emoji,
    created_at: r.created_at,
    is_viewer: r.is_viewer,
  });
}

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
    edited_at: m.edited_at,
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
      const { page = '1', limit = '20', user_id, search } = query as {
        page?: string; limit?: string; user_id: string; search?: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: MessagingQuery.getConversations,
        params: [user_id, search || null],
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

      const participant = await db.oneOrNone(MessagingQuery.getParticipant, [conversation_id, user_id]);
      if (!participant) {
        return new NotFoundException('Conversation not found');
      }

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: MessagingQuery.getMessages,
        params: [conversation_id, participant.deleted_at, user_id],
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

      const otherRead = await db.oneOrNone(MessagingQuery.getOtherParticipantLastRead, [conversation_id, user_id]);

      return {
        total: String(count),
        currentPage: page,
        totalPages: calcPages(count, limit),
        other_participant_last_read_message_id: otherRead?.last_read_message_id ?? null,
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

      await db.one(MessagingQuery.markConversationRead, [payload.conversation_id, payload.user_id, payload.up_to_message_id]);
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

      const participantIds = await db.any(MessagingQuery.getParticipantIds, [updated.conversation_id]);
      emitToUsers(participantIds.map((p: any) => p.user_id), 'message:unsent', {
        conversation_id: updated.conversation_id,
        message_id: updated.id,
      });

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

      await db.one(MessagingQuery.addReaction, [payload.message_id, payload.user_id, payload.emoji]);

      const participantIds = await db.any(MessagingQuery.getParticipantIds, [target.conversation_id]);
      emitToUsers(participantIds.map((p: any) => p.user_id), 'message:reaction:added', {
        conversation_id: target.conversation_id,
        message_id: payload.message_id,
        user_id: payload.user_id,
        emoji: payload.emoji,
      });

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

      const target = await db.oneOrNone(MessagingQuery.getMessageById, [payload.message_id]);
      if (target) {
        const participantIds = await db.any(MessagingQuery.getParticipantIds, [target.conversation_id]);
        emitToUsers(participantIds.map((p: any) => p.user_id), 'message:reaction:removed', {
          conversation_id: target.conversation_id,
          message_id: payload.message_id,
          user_id: payload.user_id,
        });
      }

      return { message: 'Reaction removed' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getUnreadCount(
    payload: dtos.GetUnreadCountDTO
  ): Promise<BadException | { unread_count: number }> {
    try {
      const result = await db.one(MessagingQuery.getTotalUnreadCount, [payload.user_id]);
      return { unread_count: parseInt(result.total_unread, 10) };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  // Deletes the conversation only from the caller's own view — the other
  // participant's copy (and the message rows themselves) are untouched, and
  // the deleter isn't blocked from sending or being messaged going forward.
  // Setting deleted_at acts as a permanent floor: it hides the conversation
  // from this user's inbox/search until a newer message arrives, and hides
  // every message up to that point forever, even after it reappears.
  public async deleteConversation(
    payload: dtos.DeleteConversationDTO
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const updated = await db.oneOrNone(MessagingQuery.deleteConversationForUser, [payload.conversation_id, payload.user_id]);
      if (!updated) {
        return new NotFoundException('Conversation not found');
      }
      return { message: 'Conversation deleted' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  // Deletes a message from the caller's own conversation view only — sent or
  // received, no time limit, no notification, no socket broadcast to the
  // other participant (this never touches their view at all). The message
  // row itself is untouched, so it's preserved for moderation and remains
  // fully visible, reactions included, to the other participant.
  public async deleteMessage(
    payload: dtos.DeleteMessageDTO
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

      await db.oneOrNone(MessagingQuery.deleteMessageForUser, [payload.message_id, payload.user_id]);
      return { message: 'Message deleted' };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getReactors(
    query: dtos.GetReactorsQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id, message_id } = query as {
        page?: string; limit?: string; user_id: string; message_id: string;
      };

      const target = await db.oneOrNone(MessagingQuery.getMessageById, [message_id]);
      if (!target) {
        return new NotFoundException('Message not found');
      }
      const participant = await db.one(MessagingQuery.isParticipant, [target.conversation_id, user_id]);
      if (!participant.exists) {
        return new NotFoundException('Message not found');
      }

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: MessagingQuery.getReactors,
        params: [user_id, message_id],
      });

      return {
        total: String(count),
        currentPage: page,
        totalPages: calcPages(count, limit),
        reactors: rows.map(mapReactorRow),
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async editMessage(
    payload: dtos.EditMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity> {
    try {
      const updated = await db.oneOrNone(MessagingQuery.editMessage, [payload.message_id, payload.user_id, payload.content]);
      if (!updated) {
        return new NotFoundException('Message not found, not editable, or you are not the sender');
      }

      const messageEntity = new entities.MessageEntity(updated);
      const participantIds = await db.any(MessagingQuery.getParticipantIds, [updated.conversation_id]);
      emitToUsers(participantIds.map((p: any) => p.user_id), 'message:edited', messageEntity);

      return messageEntity;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const MessagingRepository = new MessagingRepositoryImpl();
export default MessagingRepository;
