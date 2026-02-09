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
