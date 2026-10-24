import { BaseEntity } from '../../shared/utils/base-entity';

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  MIXED = 'mixed',
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS_ONLY = 'followers_only',
  MENTIONED_ONLY = 'mentioned_only',
  PRIVATE = 'private',
  CIRCLE_ONLY = 'circle_only',
}

export interface ContentSegment {
  type: 'text' | 'mention' | 'hashtag';
  value: string;
  user_id?: string;
}

export interface MediaAttachment {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail_url?: string;
  duration?: number;
  size?: number;
  mime_type?: string;
  filename?: string;
  order_index?: number;
}

export interface ContentFlags {
  is_sensitive: boolean;
  flagged_at: string;
  categories: string[];
  scores: Record<string, number>;
  source: 'openai_moderation';
}

export class PostEntity extends BaseEntity<PostEntity> {
  id?: string;
  user_id?: string;
  community_id?: string;
  content?: string;
  post_type?: PostType;
  visibility?: PostVisibility;
  media_attachments?: MediaAttachment[];
  parent_post_id?: string;
  quote_text?: string;
  is_pinned?: boolean;
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  quotes_count?: number;
  hashtags?: string[];
  deleted_at?: Date;
  deleted_by?: string;
  created_at?: Date;
  updated_at?: Date;
  edited_at?: Date | null;
  content_flags?: ContentFlags | null;
}

export class CommentEntity extends BaseEntity<CommentEntity> {
  id?: string;
  post_id?: string;
  user_id?: string;
  parent_comment_id?: string;
  content?: string;
  media_attachments?: MediaAttachment[];
  likes_count?: number;
  replies_count?: number;
  deleted_at?: Date;
  deleted_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class PostLikeEntity extends BaseEntity<PostLikeEntity> {
  id?: string;
  post_id?: string;
  user_id?: string;
  created_at?: Date;
}

export class CommentLikeEntity extends BaseEntity<CommentLikeEntity> {
  id?: string;
  comment_id?: string;
  user_id?: string;
  created_at?: Date;
}

export class RepostEntity extends BaseEntity<RepostEntity> {
  id?: string;
  post_id?: string;
  user_id?: string;
  created_at?: Date;
  user?: {
    id?: string;
    username?: string;
    avatar?: string;
    display_name?: string;
    is_following?: boolean;
  };
}

export class PostMentionEntity extends BaseEntity<PostMentionEntity> {
  id?: string;
  post_id?: string;
  mentioned_user_id?: string;
  mention_type?: string;
  created_at?: Date;
}

export class PostBookmarkEntity extends BaseEntity<PostBookmarkEntity> {
  id?: string;
  post_id?: string;
  user_id?: string;
  created_at?: Date;
}

export interface PostLikerPreview {
  id: string;
  username: string;
  display_name: string;
  avatar: string;
}

export class PostWithUserEntity extends BaseEntity<PostWithUserEntity> {
  id?: string;
  user_id?: string;
  community_id?: string;
  content?: string;
  content_segments?: ContentSegment[];
  post_type?: PostType;
  visibility?: PostVisibility;
  media_attachments?: MediaAttachment[];
  parent_post_id?: string;
  quote_text?: string;
  is_pinned?: boolean;
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  quotes_count?: number;
  hashtags?: string[];
  created_at?: Date;
  updated_at?: Date;
  edited_at?: Date | null;
  content_flags?: ContentFlags | null;
  is_liked?: boolean;
  is_reposted?: boolean;
  is_bookmarked?: boolean;
  reposted_at?: Date;
  // Set only when this post is appearing in a feed BECAUSE someone the
  // viewer follows reposted it (not quote-reposted — that's just normal
  // authorship) — this is the "Reposted by X" attribution. Absent/null for
  // a post the viewer is seeing because they follow its actual author, or
  // when fetched outside a feed context entirely (e.g. a direct GET by id).
  reposted_by?: {
    id?: string;
    username?: string;
    avatar?: string;
    display_name?: string;
  } | null;
  likers?: PostLikerPreview[];
  user?: {
    id?: string;
    username?: string;
    avatar?: string;
    display_name?: string;
    is_following?: boolean;
    is_in_circle?: boolean;
  };
  community?: {
    id?: string;
    name?: string;
    avatar?: string;
  } | null;
  // Embedded original testimony for a quote repost (parent_post_id set).
  // Null if the original was deleted/removed — per AC9/5, the embed becomes
  // inaccessible along with the original rather than erroring the whole
  // quote repost out.
  parent_post?: {
    id?: string;
    content?: string | null;
    content_segments?: ContentSegment[];
    media_attachments?: MediaAttachment[];
    author?: {
      id?: string;
      username?: string;
      avatar?: string;
      display_name?: string;
    };
    created_at?: Date;
  } | null;
}

export class CommentWithUserEntity extends BaseEntity<CommentWithUserEntity> {
  id?: string;
  post_id?: string;
  user_id?: string;
  parent_comment_id?: string;
  content?: string;
  content_segments?: ContentSegment[];
  media_attachments?: MediaAttachment[];
  likes_count?: number;
  replies_count?: number;
  created_at?: Date;
  updated_at?: Date;
  is_liked?: boolean;
  user?: {
    id?: string;
    username?: string;
    avatar?: string;
  };
}
