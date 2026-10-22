import Joi from 'joi';

export const createReportValidator = Joi.object({
  entity_type: Joi.string().valid('post', 'comment', 'message', 'user').required(),
  entity_id: Joi.string().required(),
  reason: Joi.string().max(200).required(),
  details: Joi.string().max(1000).optional().allow(''),
  // Only meaningful (and only accepted) when reporting a user from within a
  // DM conversation — gives moderators the conversation to pull for context.
  context_conversation_id: Joi.string().optional(),
});

export const getReportsQueryValidator = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'resolved').optional(),
  entity_type: Joi.string().valid('post', 'comment', 'message', 'user').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const reviewReportValidator = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'resolved').required(),
  moderator_action: Joi.string().valid('no_action', 'content_removed', 'user_action_taken').optional(),
});

export const reportIdValidator = Joi.object({
  reportId: Joi.string().required(),
});
