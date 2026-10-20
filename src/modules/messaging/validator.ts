import Joi from 'joi';

export const getConversationsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
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
  content: Joi.string().max(5000).when('content_type', { is: 'text', then: Joi.required() }).optional(),
  media_url: Joi.string().uri().when('content_type', { is: Joi.valid('image', 'video', 'audio'), then: Joi.required() }).optional(),
  reply_to_message_id: Joi.string().optional(),
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
