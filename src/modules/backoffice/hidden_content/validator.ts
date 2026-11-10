import Joi from 'joi';

export const fetchHiddenQueryValidator = Joi.object({
  type: Joi.string().valid('post', 'comment').default('post'),
  page: Joi.string().pattern(/^[0-9]+$/).default('1'),
  limit: Joi.string().pattern(/^[0-9]+$/).default('20'),
  search: Joi.string().trim().allow('').max(100).optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

export const contentParamValidator = Joi.object({
  type: Joi.string().valid('post', 'comment').required(),
  content_id: Joi.string().required(),
});

export const restorePayloadValidator = Joi.object({
  note: Joi.string().trim().max(1000).allow('').optional(),
});
