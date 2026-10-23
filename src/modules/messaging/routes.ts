import { Router, RequestHandler } from 'express';
import * as messagingValidator from './validator';
import messagingController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Direct messaging — conversations, messages, reactions
 */

const messagingRouter = Router();

/**
 * @swagger
 * /messaging-settings:
 *   get:
 *     summary: Get the authenticated user's "who can message me" privacy setting
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messaging privacy setting retrieved successfully
 */
messagingRouter.get(
  '/messaging-settings',
  verifyAuth,
  WatchAsyncController(messagingController.getMessagingPrivacySetting)
);

/**
 * @swagger
 * /messaging-settings:
 *   put:
 *     summary: Update who can send the authenticated user a Direct Message
 *     description: >
 *       Takes effect immediately for every future conversation-start attempt and
 *       message send, including within existing conversations — previously
 *       exchanged messages always remain visible regardless of this setting.
 *       Blocking always overrides this setting in either direction.
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [who_can_message]
 *             properties:
 *               who_can_message:
 *                 type: string
 *                 enum: [everyone, following, nobody]
 *     responses:
 *       200:
 *         description: Messaging privacy setting updated successfully
 */
messagingRouter.put(
  '/messaging-settings',
  verifyAuth,
  validateDataMiddleware(messagingValidator.updateMessagingPrivacySettingValidator, 'body'),
  WatchAsyncController(messagingController.updateMessagingPrivacySetting)
);

/**
 * @swagger
 * /story-reply-settings:
 *   get:
 *     summary: Get the authenticated user's "who can reply to my Circle stories" default
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Story reply setting retrieved successfully
 */
messagingRouter.get(
  '/story-reply-settings',
  verifyAuth,
  WatchAsyncController(messagingController.getStoryReplySetting)
);

/**
 * @swagger
 * /story-reply-settings:
 *   put:
 *     summary: Update the global default for who can reply privately to the authenticated user's stories
 *     description: >
 *       This is the sole control over who can reply to your stories — there is
 *       no per-story override. circle_only means the AUTHOR's own Circle —
 *       someone the author has added — not the replier's Circle. Blocking
 *       always overrides this setting in either direction.
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [who_can_reply]
 *             properties:
 *               who_can_reply:
 *                 type: string
 *                 enum: [everyone, circle_only, nobody]
 *     responses:
 *       200:
 *         description: Story reply setting updated successfully
 */
messagingRouter.put(
  '/story-reply-settings',
  verifyAuth,
  validateDataMiddleware(messagingValidator.updateStoryReplySettingValidator, 'body'),
  WatchAsyncController(messagingController.updateStoryReplySetting)
);

/**
 * @swagger
 * /stories/{storyId}/reply:
 *   post:
 *     summary: Reply privately to a Circle story — delivered as a Direct Message
 *     description: >
 *       Not a separate messaging system — this calls the exact same send path as
 *       a normal DM, just without a pre-existing conversation_id. The conversation
 *       with the story's author is found or created automatically. The quoted
 *       story's content is frozen into the message at send time, so the quote
 *       still renders correctly after the story itself expires and is deleted
 *       (stories hard-delete 24h after posting). Reply text is optional — a
 *       reply may be quote-only. Permission is governed solely by the author's
 *       story-reply-settings default (no per-story override exists), and a
 *       block in either direction always wins regardless.
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content_type]
 *             properties:
 *               content_type: { type: string, enum: [text, image, video, audio] }
 *               content: { type: string, maxLength: 5000 }
 *               media_url: { type: string, format: uri }
 *     responses:
 *       201:
 *         description: Reply sent successfully
 *       404:
 *         description: Story not found, expired, or deleted
 *       400:
 *         description: Not permitted to reply to this story (blocked, or excluded by the author's reply setting), or replying to your own story
 */
messagingRouter.post(
  '/stories/:storyId/reply',
  verifyAuth,
  validateDataMiddleware(messagingValidator.storyIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.sendMessageValidator, 'body'),
  WatchAsyncController(messagingController.replyToStory)
);

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: Get the authenticated user's conversations (inbox)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filters by the other participant's username or display name
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 */
messagingRouter.get(
  '/conversations',
  verifyAuth,
  validateDataMiddleware(messagingValidator.getConversationsQueryValidator, 'query'),
  WatchAsyncController(messagingController.getConversations)
);

/**
 * @swagger
 * /conversations/unread-count:
 *   get:
 *     summary: Get the total unread message count across all of the authenticated user's conversations
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
messagingRouter.get(
  '/conversations/unread-count',
  verifyAuth,
  WatchAsyncController(messagingController.getUnreadCount)
);

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Get or create a 1:1 conversation with another user
 *     description: Idempotent — reopening an existing conversation with the same user returns it rather than creating a duplicate. Fails if either user has blocked the other.
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [other_user_id]
 *             properties:
 *               other_user_id: { type: string }
 *     responses:
 *       200:
 *         description: Conversation ready
 *       400:
 *         description: Cannot message this user (self, or a block exists)
 */
messagingRouter.post(
  '/conversations',
  verifyAuth,
  validateDataMiddleware(messagingValidator.getOrCreateConversationValidator, 'body'),
  WatchAsyncController(messagingController.getOrCreateConversation)
);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation, newest first
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30, maximum: 100 }
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       404:
 *         description: Conversation not found, or you are not a participant
 */
messagingRouter.get(
  '/conversations/:conversationId/messages',
  verifyAuth,
  validateDataMiddleware(messagingValidator.conversationIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.getMessagesQueryValidator, 'query'),
  WatchAsyncController(messagingController.getMessages)
);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation (REST fallback — real-time delivery goes through the message:send socket event)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content_type]
 *             properties:
 *               content_type: { type: string, enum: [text, image, video, audio] }
 *               content: { type: string, maxLength: 5000 }
 *               media_url: { type: string, format: uri }
 *               reply_to_message_id: { type: string }
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       404:
 *         description: Conversation not found
 *       400:
 *         description: Invalid payload, or a block exists between participants
 */
messagingRouter.post(
  '/conversations/:conversationId/messages',
  verifyAuth,
  validateDataMiddleware(messagingValidator.conversationIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.sendMessageValidator, 'body'),
  WatchAsyncController(messagingController.sendMessage)
);

/**
 * @swagger
 * /conversations/{conversationId}/read:
 *   patch:
 *     summary: Mark a conversation read up to a given message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [up_to_message_id]
 *             properties:
 *               up_to_message_id: { type: string }
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *       404:
 *         description: Conversation not found
 */
messagingRouter.patch(
  '/conversations/:conversationId/read',
  verifyAuth,
  validateDataMiddleware(messagingValidator.conversationIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.markConversationReadValidator, 'body'),
  WatchAsyncController(messagingController.markConversationRead)
);

/**
 * @swagger
 * /conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation from your own inbox
 *     description: >
 *       Removes the conversation and its history from your inbox and search results only —
 *       the other participant's copy is untouched, and they are not blocked from messaging
 *       you afterward. If a new message arrives later, the conversation reappears in your
 *       inbox, but the message history from before the delete stays hidden for you.
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Conversation deleted
 *       404:
 *         description: Conversation not found
 */
messagingRouter.delete(
  '/conversations/:conversationId',
  verifyAuth,
  validateDataMiddleware(messagingValidator.conversationIdParamValidator, 'params'),
  WatchAsyncController(messagingController.deleteConversation)
);

/**
 * @swagger
 * /messages/{messageId}:
 *   patch:
 *     summary: Edit a text message's content (sender only, text messages only, cannot edit an unsent message)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 5000 }
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       404:
 *         description: Message not found, not editable (media message or already unsent), or you are not the sender
 */
messagingRouter.patch(
  '/messages/:messageId',
  verifyAuth,
  validateDataMiddleware(messagingValidator.messageIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.editMessageValidator, 'body'),
  WatchAsyncController(messagingController.editMessage)
);

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     summary: Unsend a message (soft delete — only the sender can unsend)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message unsent
 *       404:
 *         description: Message not found, already unsent, or you are not the sender
 */
messagingRouter.delete(
  '/messages/:messageId',
  verifyAuth,
  validateDataMiddleware(messagingValidator.messageIdParamValidator, 'params'),
  WatchAsyncController(messagingController.unsendMessage)
);

/**
 * @swagger
 * /messages/{messageId}/me:
 *   delete:
 *     summary: Delete a message from your own conversation only (sent or received)
 *     description: >
 *       Different from Unsend: this only hides the message from the requesting user's
 *       own view — the other participant still sees the original message and its
 *       reactions, unchanged. No time limit, no confirmation needed, no notification
 *       sent, and the message row itself is preserved for moderation purposes.
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Message deleted from your conversation
 *       404:
 *         description: Message not found
 */
messagingRouter.delete(
  '/messages/:messageId/me',
  verifyAuth,
  validateDataMiddleware(messagingValidator.messageIdParamValidator, 'params'),
  WatchAsyncController(messagingController.deleteMessage)
);

/**
 * @swagger
 * /messages/{messageId}/reactions:
 *   get:
 *     summary: List who reacted to a message, with each reactor's emoji, profile info, and whether they are the current viewer
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Reactors retrieved successfully
 *       404:
 *         description: Message not found
 */
messagingRouter.get(
  '/messages/:messageId/reactions',
  verifyAuth,
  validateDataMiddleware(messagingValidator.messageIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.getReactorsQueryValidator, 'query'),
  WatchAsyncController(messagingController.getReactors)
);

/**
 * @swagger
 * /messages/{messageId}/reactions:
 *   post:
 *     summary: React to a message (one reaction per user per message — reacting again replaces it)
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emoji]
 *             properties:
 *               emoji: { type: string, maxLength: 16 }
 *     responses:
 *       200:
 *         description: Reaction added
 *       404:
 *         description: Message not found
 */
messagingRouter.post(
  '/messages/:messageId/reactions',
  verifyAuth,
  validateDataMiddleware(messagingValidator.messageIdParamValidator, 'params'),
  validateDataMiddleware(messagingValidator.reactToMessageValidator, 'body'),
  WatchAsyncController(messagingController.reactToMessage)
);

/**
 * @swagger
 * /messages/{messageId}/reactions:
 *   delete:
 *     summary: Remove your own reaction from a message
 *     tags: [Messaging]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reaction removed
 *       404:
 *         description: Reaction not found
 */
messagingRouter.delete(
  '/messages/:messageId/reactions',
  verifyAuth,
  validateDataMiddleware(messagingValidator.messageIdParamValidator, 'params'),
  WatchAsyncController(messagingController.removeReaction)
);

export default messagingRouter;
