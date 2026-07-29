import Joi from 'joi';

const VALID_FILTERS = [
  'all',
  'mentions',
  'likes',
  'comments',
  'circle_requests',
  'follows',
  'moderation',
];

export const getNotificationsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  filter: Joi.string().valid(...VALID_FILTERS).optional(),
});

export const notificationIdParamsValidator = Joi.object({
  notificationId: Joi.string().uuid().required(),
});
