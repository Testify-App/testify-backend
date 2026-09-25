import Joi from 'joi';

export const createReportValidator = Joi.object({
  entity_type: Joi.string().valid('post', 'comment').required(),
  entity_id: Joi.string().required(),
  reason: Joi.string().max(200).required(),
  details: Joi.string().max(1000).optional().allow(''),
});

export const getReportsQueryValidator = Joi.object({
  status: Joi.string().valid('pending', 'under_review', 'resolved').optional(),
  entity_type: Joi.string().valid('post', 'comment').optional(),
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
