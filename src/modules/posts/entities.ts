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

export class PostEntity extends BaseEntity<PostEntity> {
  id?: string;
  user_id?: string;
  content?: string;
  post_type?: PostType;
  visibility?: PostVisibility;
  media_attachments?: MediaAttachment[];
  parent_post_id?: string;
  quote_text?: string;
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  quotes_count?: number;
  deleted_at?: Date;
  deleted_by?: string;
  created_at?: Date;
  updated_at?: Date;
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

export class PostWithUserEntity extends BaseEntity<PostWithUserEntity> {
  id?: string;
  user_id?: string;
  content?: string;
  post_type?: PostType;
  visibility?: PostVisibility;
  media_attachments?: MediaAttachment[];
  parent_post_id?: string;
  quote_text?: string;
  likes_count?: number;
  comments_count?: number;
  reposts_count?: number;
  quotes_count?: number;
  created_at?: Date;
  updated_at?: Date;
  is_liked?: boolean;
  is_reposted?: boolean;
  is_bookmarked?: boolean;
  user?: {
    id?: string;
    username?: string;
    avatar?: string;
  };
}

export class CommentWithUserEntity extends BaseEntity<CommentWithUserEntity> {
  id?: string;
  post_id?: string;
  user_id?: string;
  parent_comment_id?: string;
  content?: string;
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
