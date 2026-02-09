import Joi from 'joi';

export const createPostValidator = Joi.object({
  content: Joi.string().min(1).max(5000).optional(),
  visibility: Joi.string().valid('public', 'followers_only', 'mentioned_only', 'private').optional(),
  media_attachments: Joi.array().max(10).items(
    Joi.object({
      type: Joi.string().valid('image', 'video', 'audio').required(),
      url: Joi.string().uri().required(),
      thumbnail_url: Joi.string().uri().optional(),
      duration: Joi.number().optional(),
      size: Joi.number().optional(),
      mime_type: Joi.string().optional(),
      filename: Joi.string().optional(),
      order_index: Joi.number().optional(),
    })
  ).optional(),
  parent_post_id: Joi.string().uuid().optional(),
  quote_text: Joi.string().min(1).max(500).optional(),
});

export const updatePostValidator = Joi.object({
  content: Joi.string().min(1).max(5000).optional(),
  visibility: Joi.string().valid('public', 'followers_only', 'mentioned_only', 'private').optional(),
  media_attachments: Joi.array().max(10).items(
    Joi.object({
      type: Joi.string().valid('image', 'video', 'audio').required(),
      url: Joi.string().uri().required(),
      thumbnail_url: Joi.string().uri().optional(),
      duration: Joi.number().optional(),
      size: Joi.number().optional(),
      mime_type: Joi.string().optional(),
      filename: Joi.string().optional(),
      order_index: Joi.number().optional(),
    })
  ).optional(),
});

export const createCommentValidator = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  parent_comment_id: Joi.string().uuid().optional(),
  media_attachments: Joi.array().max(4).items(
    Joi.object({
      type: Joi.string().valid('image', 'video', 'audio').required(),
      url: Joi.string().uri().required(),
      thumbnail_url: Joi.string().uri().optional(),
      duration: Joi.number().optional(),
      size: Joi.number().optional(),
      mime_type: Joi.string().optional(),
      filename: Joi.string().optional(),
      order_index: Joi.number().optional(),
    })
  ).optional(),
});

export const getPostsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('created_at', 'likes_count', 'reposts_count').optional(),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').optional(),
  user_id: Joi.string().uuid().optional(),
  visibility: Joi.string().valid('public', 'followers_only', 'mentioned_only', 'private').optional(),
});

export const getCommentsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('created_at', 'likes_count').optional(),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').optional(),
});

export const getLikesQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const getRepostsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const postIdValidator = Joi.object({
  post_id: Joi.string().uuid().required(),
});

export const commentIdValidator = Joi.object({
  id: Joi.string().uuid().required(),
});

export const userIdValidator = Joi.object({
  userId: Joi.string().uuid().required(),
});
