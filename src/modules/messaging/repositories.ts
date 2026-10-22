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
    quoted_story_id: m.quoted_story_id,
    quoted_story_snapshot: m.quoted_story_snapshot,
    reactions,
  });
}

export class MessagingRepositoryImpl implements MessagingInterface {
  // Single source of truth for "can senderId message recipientId right now",
  // reused by conversation creation, every new message send (REST and
  // socket — both funnel through sendMessage below), and later by Circle
  // replies. Block always wins regardless of the recipient's privacy
  // setting. "following" means the RECIPIENT already follows the sender —
  // this is what makes Circle members (drawn from people the owner follows)
  // automatically satisfy this tier without any extra check.
  private async canMessage(
    senderId: string,
    recipientId: string
  ): Promise<{ allowed: true } | { allowed: false; reason: entities.MessageRestrictionReason }> {
    const availability = await db.oneOrNone(MessagingQuery.isAccountAvailable, [recipientId]);
    if (!availability || !availability.available) {
      return { allowed: false, reason: 'account_unavailable' };
    }

    const blocked = await db.one(MessagingQuery.isBlockedEitherDirection, [senderId, recipientId]);
    if (blocked.exists) {
      return { allowed: false, reason: 'blocked' };
    }

    const setting = await db.oneOrNone(MessagingQuery.getMessagingPrivacySetting, [recipientId]);
    const preference = setting?.who_can_message ?? 'everyone';

    if (preference === 'everyone') {
      return { allowed: true };
    }
    if (preference === 'nobody') {
      return { allowed: false, reason: 'recipient_not_accepting_messages' };
    }

    // preference === 'following'
    const isFollowed = await db.one(MessagingQuery.isFollowedByUser, [recipientId, senderId]);
    return isFollowed.exists ? { allowed: true } : { allowed: false, reason: 'recipient_not_accepting_messages' };
  }

  // Shared by getOrCreateConversation and the story-reply path in sendMessage
  // — finds the existing 1:1 conversation or creates one, with no permission
  // check of its own. Callers run whichever permission check applies to them
  // first (general canMessage for a normal conversation start, the separate
  // story-reply resolver for a quoted reply) before calling this.
  private async findOrCreateConversationId(userId: string, otherUserId: string): Promise<string> {
    const existing = await db.oneOrNone(MessagingQuery.findDirectConversation, [userId, otherUserId]);
    if (existing) {
      return existing.id;
    }

    const result = await db.tx(async (t) => {
      const conversation = await t.one(MessagingQuery.createConversation);
      await t.none(MessagingQuery.addParticipant, [conversation.id, userId]);
      await t.none(MessagingQuery.addParticipant, [conversation.id, otherUserId]);
      return conversation;
    });

    return result.id;
  }

  public async getOrCreateConversation(
    payload: dtos.GetOrCreateConversationDTO
  ): Promise<BadException | { id: string }> {
    try {
      if (payload.user_id === payload.other_user_id) {
        return new BadException('You cannot message yourself');
      }

      const permission = await this.canMessage(payload.user_id, payload.other_user_id);
      if (!permission.allowed) {
        return new BadException('You cannot message this user');
      }

      const id = await this.findOrCreateConversationId(payload.user_id, payload.other_user_id);
      return { id };
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

      const conversations = await Promise.all(rows.map(async (row: any) => {
        let restriction_reason: entities.MessageRestrictionReason | null = null;
        if (!row.can_send_message) {
          if (row.other_account_unavailable) {
            restriction_reason = 'account_unavailable';
          } else {
            const blocked = await db.one(MessagingQuery.isBlockedEitherDirection, [user_id, row.other_user_id]);
            restriction_reason = blocked.exists ? 'blocked' : 'recipient_not_accepting_messages';
          }
        }

        return new entities.ConversationEntity({
          id: row.id,
          type: row.type,
          last_message_at: row.last_message_at,
          created_at: row.created_at,
          other_participant: row.other_account_unavailable
            ? {
                id: row.other_user_id,
                username: null,
                display_name: 'Deleted Account',
                avatar: null,
                is_account_available: false,
                is_account_deleted: row.other_account_deleted,
              }
            : {
                id: row.other_user_id,
                username: row.other_username,
                display_name: row.other_display_name,
                avatar: row.other_avatar,
                is_account_available: true,
                is_account_deleted: false,
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
          can_send_message: row.can_send_message,
          restriction_reason,
        });
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

  // Story-reply permission resolver — block → per-story override → the
  // author's global default → Circle check. Runs INSTEAD of canMessage for
  // this one send, not in addition to it: Circle membership is the whole
  // point of the circle_only tier, so it must not also require the author's
  // general messaging-privacy setting to allow everyone.
  private async resolveStoryReplyPermission(
    replierId: string,
    story: { author_id: string; allow_replies: boolean | null }
  ): Promise<{ allowed: true } | { allowed: false; reason: entities.MessageRestrictionReason }> {
    const blocked = await db.one(MessagingQuery.isBlockedEitherDirection, [replierId, story.author_id]);
    if (blocked.exists) {
      return { allowed: false, reason: 'blocked' };
    }

    let effective: 'everyone' | 'circle_only' | 'nobody';
    if (story.allow_replies !== null) {
      effective = story.allow_replies ? 'everyone' : 'nobody';
    } else {
      const setting = await db.oneOrNone(MessagingQuery.getStoryReplySetting, [story.author_id]);
      effective = setting?.who_can_reply ?? 'everyone';
    }

    if (effective === 'everyone') {
      return { allowed: true };
    }
    if (effective === 'nobody') {
      return { allowed: false, reason: 'recipient_not_accepting_messages' };
    }

    // effective === 'circle_only'
    const inCircle = await db.one(MessagingQuery.isInAuthorsCircle, [story.author_id, replierId]);
    return inCircle.exists ? { allowed: true } : { allowed: false, reason: 'recipient_not_accepting_messages' };
  }

  public async sendMessage(
    payload: dtos.SendMessageDTO
  ): Promise<BadException | NotFoundException | entities.MessageEntity> {
    try {
      let conversationId: string = payload.conversation_id as string;
      let otherParticipant: { user_id: string } | null = null;
      let quotedStorySnapshot: Record<string, any> | null = null;

      if (payload.quoted_story_id) {
        const story = await db.oneOrNone(MessagingQuery.getStoryForReply, [payload.quoted_story_id]);
        if (!story) {
          return new NotFoundException('Story not found or no longer available');
        }
        if (story.author_id === payload.user_id) {
          return new BadException('You cannot reply to your own story');
        }

        const permission = await this.resolveStoryReplyPermission(payload.user_id, story);
        if (!permission.allowed) {
          return new BadException('You cannot reply to this story');
        }

        conversationId = await this.findOrCreateConversationId(payload.user_id, story.author_id);
        otherParticipant = { user_id: story.author_id };

        // Frozen at reply time — survives the story's 24h hard-delete by
        // design, same as how WhatsApp/Instagram quote a story in a DM.
        quotedStorySnapshot = {
          content_type: story.content_type,
          media_url: story.media_url,
          thumbnail_url: story.thumbnail_url,
          text_content: story.text_content,
          background_style: story.background_style,
          author_id: story.author_id,
          author_username: story.author_username,
          author_display_name: story.author_display_name,
          story_created_at: story.created_at,
        };
      } else {
        if (!payload.conversation_id) {
          return new BadException('conversation_id is required unless quoted_story_id is set');
        }

        const participant = await db.one(MessagingQuery.isParticipant, [payload.conversation_id, payload.user_id]);
        if (!participant.exists) {
          return new NotFoundException('Conversation not found');
        }

        // Re-checked on every send, not just at conversation creation — the
        // recipient's messaging-privacy setting can change at any time, and an
        // existing conversation's history stays visible regardless, but new
        // sends must honor whatever the setting is right now.
        const other = await db.oneOrNone(MessagingQuery.getOtherParticipant, [payload.conversation_id, payload.user_id]);
        if (other) {
          const permission = await this.canMessage(payload.user_id, other.user_id);
          if (!permission.allowed) {
            return new BadException('You cannot message this user');
          }
        }
        otherParticipant = other;

        if (payload.reply_to_message_id) {
          const replyTarget = await db.oneOrNone(MessagingQuery.getMessageById, [payload.reply_to_message_id]);
          if (!replyTarget || replyTarget.conversation_id !== payload.conversation_id) {
            return new BadException('Message being replied to was not found in this conversation');
          }
        }
      }

      const message = await db.tx(async (t) => {
        const created = await t.one(MessagingQuery.createMessage, [
          conversationId,
          payload.user_id,
          payload.reply_to_message_id || null,
          payload.content_type,
          payload.content || null,
          payload.media_url || null,
          payload.quoted_story_id || null,
          quotedStorySnapshot ? JSON.stringify(quotedStorySnapshot) : null,
        ]);
        await t.none(MessagingQuery.updateConversationLastMessage, [conversationId, created.id]);
        return created;
      });

      const messageEntity = new entities.MessageEntity(message);

      if (otherParticipant) {
        emitToUser(otherParticipant.user_id, 'message:new', messageEntity);

        isUserOnline(otherParticipant.user_id)
          .then((online) => {
            if (online) return;
            return createNotification({
              user_id: otherParticipant!.user_id,
              actor_id: payload.user_id,
              type: 'message',
              entity_type: 'conversation',
              entity_id: conversationId,
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

  public async getMessagingPrivacySetting(
    payload: dtos.GetMessagingPrivacySettingDTO
  ): Promise<BadException | entities.MessagingPrivacySettingEntity> {
    try {
      const row = await db.oneOrNone(MessagingQuery.getMessagingPrivacySetting, [payload.user_id]);
      return new entities.MessagingPrivacySettingEntity({
        who_can_message: row?.who_can_message ?? 'everyone',
        updated_at: row?.updated_at,
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  // Takes effect immediately for every future send/conversation-creation
  // check (canMessage reads this table fresh on every call, nothing is
  // cached). Also pushes a live update to every existing conversation
  // partner so an open chat's UI can disable its composer right away,
  // without waiting for the other side to refresh or re-fetch the inbox.
  public async updateMessagingPrivacySetting(
    payload: dtos.UpdateMessagingPrivacySettingDTO
  ): Promise<BadException | entities.MessagingPrivacySettingEntity> {
    try {
      const updated = await db.one(MessagingQuery.upsertMessagingPrivacySetting, [payload.user_id, payload.who_can_message]);

      const partners = await db.any(MessagingQuery.getConversationPartnerIds, [payload.user_id]);
      for (const partner of partners) {
        const permission = await this.canMessage(partner.user_id, payload.user_id);
        emitToUser(partner.user_id, 'conversation:permission-changed', {
          conversation_id: partner.conversation_id,
          other_user_id: payload.user_id,
          can_send_message: permission.allowed,
          restriction_reason: permission.allowed ? null : permission.reason,
        });
      }

      return new entities.MessagingPrivacySettingEntity({
        who_can_message: updated.who_can_message,
        updated_at: updated.updated_at,
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getStoryReplySetting(
    payload: dtos.GetStoryReplySettingDTO
  ): Promise<BadException | entities.StoryReplySettingEntity> {
    try {
      const row = await db.oneOrNone(MessagingQuery.getStoryReplySetting, [payload.user_id]);
      return new entities.StoryReplySettingEntity({
        who_can_reply: row?.who_can_reply ?? 'everyone',
        updated_at: row?.updated_at,
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  // Takes effect immediately — resolveStoryReplyPermission reads this table
  // fresh on every reply attempt, nothing is cached. No live socket push on
  // change (unlike messaging-privacy): this setting only matters at the
  // moment someone attempts a reply to a specific story, not for an ongoing
  // conversation's composer state.
  public async updateStoryReplySetting(
    payload: dtos.UpdateStoryReplySettingDTO
  ): Promise<BadException | entities.StoryReplySettingEntity> {
    try {
      const updated = await db.one(MessagingQuery.upsertStoryReplySetting, [payload.user_id, payload.who_can_reply]);
      return new entities.StoryReplySettingEntity({
        who_can_reply: updated.who_can_reply,
        updated_at: updated.updated_at,
      });
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
