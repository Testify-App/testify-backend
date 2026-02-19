import Joi from 'joi';

export const updateProfileValidator = Joi.object({
  first_name: Joi.string().max(100).optional(),
  last_name: Joi.string().max(100).optional(),
  country_code: Joi.string().max(10).optional(),
  phone_number: Joi.string().max(20).optional(),
  avatar: Joi.string().uri().optional(),
  username: Joi.string().alphanum().min(3).max(30).optional(),
  bio: Joi.string().max(500).optional(),
  instagram: Joi.string().uri().optional(),
  youtube: Joi.string().uri().optional(),
  twitter: Joi.string().uri().optional(),
});

export const getByUsernameValidator = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
});

export const addToTribeValidator = Joi.object({
  following_id: Joi.string().required(),
});

export const getTribeMembersValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const unfollowValidator = Joi.object({
  confirm: Joi.boolean().optional().default(false),
});

// Circle validators
export const sendCircleRequestValidator = Joi.object({
  connected_user_id: Joi.string().required(),
});

export const acceptCircleRequestValidator = Joi.object({
  request_id: Joi.string().required(),
});

export const rejectCircleRequestValidator = Joi.object({
  request_id: Joi.string().required(),
});

export const getCircleMembersValidator = Joi.object({
  limit: Joi.number().min(1).max(100).optional().default(20),
  offset: Joi.number().min(0).optional().default(0),
});

export const searchProfilesByUsernameValidator = Joi.object({
  search: Joi.string().min(1).max(100).required(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
