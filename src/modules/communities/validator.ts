import Joi from 'joi';

const ruleSchema = Joi.object({
  text: Joi.string().max(200).required(),
});

export const createCommunityValidator = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().max(100).optional(),
  avatar: Joi.string().uri().optional(),
  cover_image: Joi.string().uri().optional(),
  visibility: Joi.string().valid('public', 'private').optional().default('public'),
  rules: Joi.array().items(ruleSchema).max(20).optional().default([]),
});

export const communityIdValidator = Joi.object({
  communityId: Joi.string().required(),
});

export const getMyCommunitiesValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const updateCommunityValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  category: Joi.string().max(100).optional().allow(''),
  avatar: Joi.string().uri().optional().allow(''),
  cover_image: Joi.string().uri().optional().allow(''),
  visibility: Joi.string().valid('public', 'private').optional(),
  rules: Joi.array().items(ruleSchema).max(20).optional(),
});

export const deleteCommunityValidator = Joi.object({
  confirm: Joi.string().valid('DELETE').required().messages({
    'any.only': 'You must type DELETE to confirm',
  }),
});

export const getCommunityMembersValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const banMemberValidator = Joi.object({
  reason: Joi.string().max(500).optional(),
});

export const reportValidator = Joi.object({
  reason: Joi.string().max(500).optional(),
});

export const reviewReportValidator = Joi.object({
  status: Joi.string().valid('reviewed', 'dismissed').required(),
});

export const communityUserParamsValidator = Joi.object({
  communityId: Joi.string().required(),
  userId: Joi.string().required(),
});

export const communityTestimonyParamsValidator = Joi.object({
  communityId: Joi.string().required(),
  testimonyId: Joi.string().required(),
});

export const communityReportParamsValidator = Joi.object({
  communityId: Joi.string().required(),
  reportId: Joi.string().required(),
});

const mediaAttachmentSchema = Joi.object({
  type: Joi.string().valid('image', 'video', 'audio').required(),
  url: Joi.string().uri().required(),
  thumbnail_url: Joi.string().uri().optional(),
  duration: Joi.number().optional(),
  size: Joi.number().optional(),
  mime_type: Joi.string().optional(),
  filename: Joi.string().optional(),
  order_index: Joi.number().integer().optional(),
});

export const createCommunityPostValidator = Joi.object({
  content: Joi.string().max(5000).optional().allow(''),
  media_attachments: Joi.array().items(mediaAttachmentSchema).max(10).optional(),
}).or('content', 'media_attachments');

export const getCommunityTestimoniesValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
