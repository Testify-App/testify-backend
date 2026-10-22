import Joi from 'joi';

export const getConversationsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().min(1).max(100).optional(),
});

export const getOrCreateConversationValidator = Joi.object({
  other_user_id: Joi.string().required(),
});

export const conversationIdParamValidator = Joi.object({
  conversationId: Joi.string().required(),
});

export const getMessagesQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const sendMessageValidator = Joi.object({
  content_type: Joi.string().valid('text', 'image', 'video', 'audio').required(),
  // Not required when quoted_story_id is set — a story reply may be
  // quote-only (just the quote, no typed text), same as reacting to a story
  // with just an emoji in other apps.
  content: Joi.string().max(5000).when('content_type', {
    is: 'text',
    then: Joi.when('quoted_story_id', { is: Joi.exist(), then: Joi.optional(), otherwise: Joi.required() }),
  }).optional(),
  media_url: Joi.string().uri().when('content_type', { is: Joi.valid('image', 'video', 'audio'), then: Joi.required() }).optional(),
  reply_to_message_id: Joi.string().optional(),
  quoted_story_id: Joi.string().optional(),
});

export const markConversationReadValidator = Joi.object({
  up_to_message_id: Joi.string().required(),
});

export const messageIdParamValidator = Joi.object({
  messageId: Joi.string().required(),
});

export const reactToMessageValidator = Joi.object({
  emoji: Joi.string().max(16).required(),
});

export const getReactorsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const editMessageValidator = Joi.object({
  content: Joi.string().min(1).max(5000).required(),
});

export const updateMessagingPrivacySettingValidator = Joi.object({
  who_can_message: Joi.string().valid('everyone', 'following', 'nobody').required(),
});

export const updateStoryReplySettingValidator = Joi.object({
  who_can_reply: Joi.string().valid('everyone', 'circle_only', 'nobody').required(),
});

export const storyIdParamValidator = Joi.object({
  storyId: Joi.string().required(),
});
