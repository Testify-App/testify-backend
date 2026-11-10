import Joi from 'joi';

export const fetchLogsQueryValidator = Joi.object({
  page: Joi.string().pattern(/^[0-9]+$/).default('1'),
  limit: Joi.string().pattern(/^[0-9]+$/).default('20'),
  search: Joi.string().trim().allow('').max(100).optional(),
  action: Joi.string().max(60).optional(),
  actor_id: Joi.string().optional(),
  entity_type: Joi.string().valid('post', 'comment', 'user', 'report', 'role', 'admin').optional(),
  category: Joi.string().valid('moderation', 'admin', 'views').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

export const exportLogsQueryValidator = fetchLogsQueryValidator.keys({
  page: Joi.any().strip(),
  limit: Joi.any().strip(),
});
