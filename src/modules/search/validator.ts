import Joi from 'joi';

export const searchQueryValidator = Joi.object({
  q: Joi.string().min(1).max(100).required(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
