import Joi from 'joi';

const page = Joi.string().pattern(/^[0-9]+$/).default('1');
const limit = Joi.string().pattern(/^[0-9]+$/).default('20').custom((value, helpers) => (
  Number(value) > 100 ? helpers.error('any.invalid') : value
));

export const fetchUsersQueryValidator = Joi.object({
  page,
  limit,
  search: Joi.string().trim().allow('').max(100).optional(),
  status: Joi.string().valid('active', 'suspended', 'banned', 'restricted').optional(),
  flagged: Joi.boolean().optional(),
  joined_from: Joi.date().iso().optional(),
  joined_to: Joi.date().iso().optional(),
  sort: Joi.string()
    .valid('newest', 'oldest', 'username', 'last_login', 'reports', 'restricted_recent', 'restriction_type')
    .default('newest'),
});

export const userIdParamValidator = Joi.object({
  user_id: Joi.string().required(),
});

export const noteParamValidator = Joi.object({
  user_id: Joi.string().required(),
  note_id: Joi.string().guid().required(),
});

export const flaggedContentQueryValidator = Joi.object({
  page,
  limit,
  sort: Joi.string().valid('recent', 'severity', 'reports').default('recent'),
});

const reason = {
  reason_code: Joi.string().max(50).allow(null, '').optional(),
  reason: Joi.string().trim().max(500).allow(null, '').optional(),
  note: Joi.string().trim().max(2000).allow(null, '').optional(),
  notify: Joi.boolean().default(true),
};

export const suspendPayloadValidator = Joi.object({
  ...reason,
  // Whole days, or null for indefinite.
  duration_days: Joi.number().integer().min(1).max(3650).allow(null).required(),
});

export const banPayloadValidator = Joi.object(reason);

export const reinstatePayloadValidator = Joi.object(reason);

export const notePayloadValidator = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required(),
  tag: Joi.string().valid('warning', 'positive', 'neutral', 'pending_review').allow(null).optional(),
});

export const warningPayloadValidator = Joi.object({
  template_key: Joi.string().max(50).optional(),
  message: Joi.string().trim().max(1000).allow('').optional(),
  send_email: Joi.boolean().default(false),
}).or('template_key', 'message');

export const warningIdParamValidator = Joi.object({
  warning_id: Joi.string().guid().required(),
});
