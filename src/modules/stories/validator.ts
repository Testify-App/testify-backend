import Joi from 'joi';

export const createStoryValidator = Joi.object({
  content_type: Joi.string().valid('text', 'image', 'video').required(),
  media_url: Joi.string().uri().when('content_type', {
    is: Joi.valid('image', 'video'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  thumbnail_url: Joi.string().uri().optional(),
  text_content: Joi.string().max(500).when('content_type', {
    is: 'text',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  background_style: Joi.object().optional(),
  duration: Joi.number().integer().min(0).max(60).optional(),
});

export const storyIdValidator = Joi.object({
  storyId: Joi.string().required(),
});

export const getStoryViewersValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
