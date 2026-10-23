import Joi from 'joi';

const hashtagContentRule = Joi.string().min(1).max(5000).custom((value, helpers) => {
  const regex = /#([a-zA-Z0-9]+)/g;
  const matches = value.match(regex) ?? [];
  const unique = [...new Set(matches.map((m: string) => m.toLowerCase()))];
  if (unique.length > 10) {
    return helpers.error('any.invalid', { message: 'Posts may contain a maximum of 10 hashtags' });
  }
  return value;
}).optional();

export const createPostValidator = Joi.object({
  community_id: Joi.string().optional(),
  content: hashtagContentRule,
  visibility: Joi.string().valid('public', 'followers_only', 'mentioned_only', 'private', 'circle_only').optional(),
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
  sensitive_content: Joi.boolean().optional(),
});

export const updatePostValidator = Joi.object({
  content: hashtagContentRule,
  visibility: Joi.string().valid('public', 'followers_only', 'mentioned_only', 'private', 'circle_only').optional(),
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
  sensitive_content: Joi.boolean().optional(),
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

export const getMyPostsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().max(200).optional(),
});

export const getPostsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('created_at', 'likes_count', 'reposts_count').optional(),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').optional(),
  user_id: Joi.string().uuid().optional(),
  visibility: Joi.string().valid('public', 'followers_only', 'mentioned_only', 'private', 'circle_only').optional(),
  search: Joi.string().max(200).optional(),
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

export const getQuotePostsQueryValidator = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const postIdValidator = Joi.object({
  post_id: Joi.string().uuid().required(),
});

export const idValidator = Joi.object({
  id: Joi.string().uuid().required(),
});

export const commentIdValidator = Joi.object({
  id: Joi.string().uuid().required(),
});

export const commentReplyParamValidator = Joi.object({
  comment_id: Joi.string().uuid().required(),
});

export const userIdValidator = Joi.object({
  userId: Joi.string().uuid().required(),
});

const MAX_IMPRESSIONS_PER_BATCH = 100;
const MAX_IMPRESSION_DWELL_MS = 60 * 60 * 1000; // 1 hour — a sanity ceiling, not a real viewing duration

export const createImpressionsValidator = Joi.object({
  impressions: Joi.array().min(1).max(MAX_IMPRESSIONS_PER_BATCH).items(
    Joi.object({
      post_id: Joi.string().uuid().required(),
      source: Joi.string().valid('feed', 'profile', 'community', 'search').required(),
      dwell_ms: Joi.number().integer().min(0).max(MAX_IMPRESSION_DWELL_MS).optional(),
      skipped: Joi.boolean().optional(),
    })
  ).required(),
});
