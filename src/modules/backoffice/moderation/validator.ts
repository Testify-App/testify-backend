import Joi from 'joi';

const page = Joi.string().pattern(/^[0-9]+$/).default('1');
const limit = (max = 100) => Joi.string().pattern(/^[0-9]+$/).default('20').custom((value, helpers) => (
  Number(value) > max ? helpers.error('any.invalid') : value
));

export const fetchReportsQueryValidator = Joi.object({
  page,
  limit: limit(100),
  search: Joi.string().trim().allow('').max(100).optional(),
  status: Joi.string().valid('pending', 'under_review', 'resolved').optional(),
  reason: Joi.string().trim().max(50).optional(),
  entity_type: Joi.string().valid('post', 'comment', 'user', 'message').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  moderator_id: Joi.string().optional(),
  sort: Joi.string().valid('newest', 'oldest', 'severity').default('newest'),
});

export const exportReportsQueryValidator = fetchReportsQueryValidator.keys({
  page: Joi.any().strip(),
  limit: Joi.any().strip(),
});

export const reportIdParamValidator = Joi.object({
  report_id: Joi.string().required(),
});

export const userIdParamValidator = Joi.object({
  user_id: Joi.string().required(),
});

export const userReportsQueryValidator = Joi.object({
  role: Joi.string().valid('reporter', 'owner').required(),
  page,
  limit: limit(100),
});

export const resolveReportPayloadValidator = Joi.object({
  decision: Joi.string().valid('no_action', 'remove_content', 'account_action').required(),
  account_action: Joi.string().valid('warning', 'suspend', 'ban').when('decision', {
    is: 'account_action', then: Joi.required(), otherwise: Joi.forbidden(),
  }),
  // Suspensions only: whole days, or null for indefinite.
  duration_days: Joi.number().integer().min(1).max(3650).allow(null).optional(),
  warning_template: Joi.string().max(50).optional(),
  notes: Joi.string().trim().max(2000).allow('').optional(),
  notify: Joi.boolean().default(true),
});

export const summaryQueryValidator = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});
