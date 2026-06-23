import Joi from 'joi';

export const hashtagParamValidator = Joi.object({
  tag: Joi.string().alphanum().min(1).max(50).required(),
});

export const hashtagFeedQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const trendingQueryValidator = Joi.object({
  limit: Joi.number().integer().min(1).max(50).optional(),
});

export const searchQueryValidator = Joi.object({
  q: Joi.string().alphanum().min(1).max(50).required(),
});
