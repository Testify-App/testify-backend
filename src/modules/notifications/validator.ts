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

const filterValueSchema = Joi.string().valid(...VALID_FILTERS);

export const getNotificationsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  // Accepts a single value (?filter=likes), a comma-separated list
  // (?filter=likes,comments), or repeated query params (?filter=likes&filter=comments).
  filter: Joi.alternatives()
    .try(
      filterValueSchema,
      Joi.string().custom((value: string, helpers) => {
        const parts = value.split(',').map((v) => v.trim());
        for (const part of parts) {
          if (!VALID_FILTERS.includes(part)) {
            return helpers.error('any.only');
          }
        }
        return value;
      }),
      Joi.array().items(filterValueSchema)
    )
    .optional(),
});

export const notificationIdParamsValidator = Joi.object({
  notificationId: Joi.string().uuid().required(),
});

export const updateNotificationPreferencesValidator = Joi.object({
  likes: Joi.boolean().optional(),
  comments_replies: Joi.boolean().optional(),
  mentions: Joi.boolean().optional(),
  new_followers: Joi.boolean().optional(),
  reposts: Joi.boolean().optional(),
  circle_activity: Joi.boolean().optional(),
}).min(1);
