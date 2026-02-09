# Posts Module - Database Migration Specification

## Overview

This document outlines the database schema for a Twitter/X-like posts system with support for:
- Posts with text, images, music, and other media
- Comments on posts
- Likes on posts and comments
- Quote reposts
- User interactions (bookmarks, mentions)
- Soft delete functionality

## Table of Contents

1. [Database Schema](#database-schema)
2. [Entity Classes](#entity-classes)
3. [Complete Migration SQL](#complete-migration-sql)
4. [File Structure](#file-structure)
5. [API Endpoints](#api-endpoints)
6. [Request Validators](#request-validators)
7. [Features Summary](#features-summary)
8. [Query Examples](#query-examples)

---

## Database Schema

### 1. Posts Table

Stores the main posts created by users.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier (UUID) |
| `user_id` | VARCHAR (FK) | References `users(id)` |
| `content` | TEXT | Post text content |
| `post_type` | ENUM | `text`, `image`, `video`, `audio`, `mixed` |
| `visibility` | ENUM | `public`, `followers_only`, `mentioned_only`, `private` |
| `media_attachments` | JSONB | Array of media metadata |
| `parent_post_id` | VARCHAR (FK) | For quote reposts, references original post |
| `quote_text` | TEXT | Additional text when quoting |
| `likes_count` | INTEGER | Denormalized like count |
| `comments_count` | INTEGER | Denormalized comment count |
| `reposts_count` | INTEGER | Denormalized repost count |
| `quotes_count` | INTEGER | Denormalized quote count |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp |
| `deleted_by` | VARCHAR | User who deleted |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

### 2. Comments Table

Stores comments on posts with nested reply support.

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier |
| `post_id` | VARCHAR (FK) | References `posts(id)` |
| `user_id` | VARCHAR (FK) | References `users(id)` |
| `parent_comment_id` | VARCHAR (FK) | For nested replies |
| `content` | TEXT | Comment text |
| `media_attachments` | JSONB | Optional media |
| `likes_count` | INTEGER | Denormalized like count |
| `replies_count` | INTEGER | Denormalized reply count |
| `deleted_at` | TIMESTAMPTZ | Soft delete timestamp |
| `deleted_by` | VARCHAR | User who deleted |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

### 3. Post Likes Table

Tracks likes on posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier |
| `post_id` | VARCHAR (FK) | References `posts(id)` |
| `user_id` | VARCHAR (FK) | References `users(id)` |
| `created_at` | TIMESTAMPTZ | When liked |

**Constraint:** `UNIQUE(post_id, user_id)` - prevents duplicate likes

---

### 4. Comment Likes Table

Tracks likes on comments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier |
| `comment_id` | VARCHAR (FK) | References `comments(id)` |
| `user_id` | VARCHAR (FK) | References `users(id)` |
| `created_at` | TIMESTAMPTZ | When liked |

**Constraint:** `UNIQUE(comment_id, user_id)` - prevents duplicate likes

---

### 5. Reposts Table

Tracks reposts (retweets without quote text).

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier |
| `post_id` | VARCHAR (FK) | References `posts(id)` |
| `user_id` | VARCHAR (FK) | References `users(id)` |
| `created_at` | TIMESTAMPTZ | When reposted |

**Constraint:** `UNIQUE(post_id, user_id)` - prevents duplicate reposts

---

### 6. Post Mentions Table

Tracks `@mentions` in posts for notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier |
| `post_id` | VARCHAR (FK) | References `posts(id)` |
| `mentioned_user_id` | VARCHAR (FK) | References `users(id)` |
| `mention_type` | VARCHAR | `content` or `quote` |
| `created_at` | TIMESTAMPTZ | When mentioned |

---

### 7. Post Bookmarks Table

Allows users to save/bookmark posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR (PK) | Unique identifier |
| `post_id` | VARCHAR (FK) | References `posts(id)` |
| `user_id` | VARCHAR (FK) | References `users(id)` |
| `created_at` | TIMESTAMPTZ | When bookmarked |

**Constraint:** `UNIQUE(post_id, user_id)` - prevents duplicate bookmarks

---

## Entity Classes

### PostEntity

```typescript
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
  id: string;
  user_id: string;
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
```

### CommentEntity

```typescript
export class CommentEntity extends BaseEntity<CommentEntity> {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  media_attachments?: MediaAttachment[];
  likes_count?: number;
  replies_count?: number;
  deleted_at?: Date;
  deleted_by?: string;
  created_at?: Date;
  updated_at?: Date;
}
```

### PostLikeEntity

```typescript
export class PostLikeEntity extends BaseEntity<PostLikeEntity> {
  id: string;
  post_id: string;
  user_id: string;
  created_at?: Date;
}
```

### CommentLikeEntity

```typescript
export class CommentLikeEntity extends BaseEntity<CommentLikeEntity> {
  id: string;
  comment_id: string;
  user_id: string;
  created_at?: Date;
}
```

### RepostEntity

```typescript
export class RepostEntity extends BaseEntity<RepostEntity> {
  id: string;
  post_id: string;
  user_id: string;
  created_at?: Date;
}
```

### PostMentionEntity

```typescript
export class PostMentionEntity extends BaseEntity<PostMentionEntity> {
  id: string;
  post_id: string;
  mentioned_user_id: string;
  mention_type?: string;
  created_at?: Date;
}
```

### PostBookmarkEntity

```typescript
export class PostBookmarkEntity extends BaseEntity<PostBookmarkEntity> {
  id: string;
  post_id: string;
  user_id: string;
  created_at?: Date;
}
```

---

## Complete Migration SQL

```sql
-- ==============================================
-- Posts Module Migration
-- ==============================================

-- Create ENUM types
DROP TYPE IF EXISTS post_type;
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'mixed');

DROP TYPE IF EXISTS post_visibility;
CREATE TYPE post_visibility AS ENUM ('public', 'followers_only', 'mentioned_only', 'private');

-- ==============================================
-- Posts Table
-- ==============================================
CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NULL,
  post_type post_type DEFAULT 'text',
  visibility post_visibility DEFAULT 'public',
  media_attachments JSONB DEFAULT '[]',
  parent_post_id VARCHAR NULL REFERENCES posts(id) ON DELETE CASCADE,
  quote_text TEXT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  quotes_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by VARCHAR NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL
);

-- ==============================================
-- Comments Table
-- ==============================================
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id VARCHAR NULL REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_attachments JSONB DEFAULT '[]',
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by VARCHAR NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL
);

-- ==============================================
-- Post Likes Table
-- ==============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ==============================================
-- Comment Likes Table
-- ==============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  comment_id VARCHAR NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ==============================================
-- Reposts Table
-- ==============================================
CREATE TABLE IF NOT EXISTS reposts (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ==============================================
-- Post Mentions Table
-- ==============================================
CREATE TABLE IF NOT EXISTS post_mentions (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mention_type VARCHAR DEFAULT 'content',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, mentioned_user_id)
);

-- ==============================================
-- Post Bookmarks Table
-- ==============================================
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ==============================================
-- Indexes
-- ==============================================

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_parent_post_id ON posts(parent_post_id) WHERE parent_post_id IS NOT NULL;
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC);

-- Post likes indexes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_likes_created_at ON post_likes(created_at DESC);

-- Comment likes indexes
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Reposts indexes
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_created_at ON reposts(created_at DESC);

-- Post mentions indexes
CREATE INDEX idx_post_mentions_post_id ON post_mentions(post_id);
CREATE INDEX idx_post_mentions_mentioned_user_id ON post_mentions(mentioned_user_id);

-- Post bookmarks indexes
CREATE INDEX idx_post_bookmarks_user_id ON post_bookmarks(user_id);
CREATE INDEX idx_post_bookmarks_created_at ON post_bookmarks(created_at DESC);
```

### Down Migration (Rollback)

```sql
-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS post_bookmarks;
DROP TABLE IF EXISTS post_mentions;
DROP TABLE IF EXISTS reposts;
DROP TABLE IF EXISTS comment_likes;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;

-- Drop ENUM types
DROP TYPE IF EXISTS post_visibility;
DROP TYPE IF EXISTS post_type;
```

---

## File Structure

Create the following files in `src/modules/posts/`:

```
src/modules/posts/
├── entities.ts      # Entity classes
├── interface.ts     # TypeScript interfaces
├── dto.ts           # Data Transfer Objects
├── repositories.ts  # Database queries
├── services.ts      # Business logic
├── controller.ts    # HTTP handlers
├── routes.ts        # Route definitions
└── validator.ts     # Validation schemas
```

---

## API Endpoints

### Base Route
`/api/v1/posts`

### Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| **POST** | `/` | Create a new post | Yes |
| **GET** | `/` | Get feed/posts list | Yes |
| **GET** | `/:id` | Get single post | Yes |
| **PUT** | `/:id` | Update a post | Yes |
| **DELETE** | `/:id` | Delete a post | Yes |
| **POST** | `/:id/like` | Like a post | Yes |
| **DELETE** | `/:id/like` | Unlike a post | Yes |
| **POST** | `/:id/repost` | Repost a post | Yes |
| **DELETE** | `/:id/repost` | Remove repost | Yes |
| **POST** | `/:id/quote` | Quote repost | Yes |
| **POST** | `/:id/bookmark` | Bookmark a post | Yes |
| **DELETE** | `/:id/bookmark` | Remove bookmark | Yes |
| **GET** | `/:id/likes` | Get post likes | Yes |
| **GET** | `/:id/reposts` | Get post reposts | Yes |
| **POST** | `/:id/comments` | Create a comment | Yes |
| **GET** | `/:id/comments` | Get post comments | Yes |
| **GET** | `/user/:userId` | Get user's posts | Yes |
| **GET** | `/bookmarks` | Get user's bookmarks | Yes |

---

## Request Validators

### Create Post Validator

```typescript
// validator.ts
export const createPostValidator = [
  body('content')
    .optional()
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'followers_only', 'mentioned_only', 'private'])
    .withMessage('Invalid visibility setting'),
  
  body('media_attachments')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 media attachments allowed'),
  
  body('media_attachments.*.type')
    .optional()
    .isIn(['image', 'video', 'audio'])
    .withMessage('Media type must be image, video, or audio'),
  
  body('media_attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid media URL'),
  
  body('parent_post_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent post ID'),
  
  body('quote_text')
    .optional()
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Quote text must be between 1 and 500 characters'),
];
```

### Create Comment Validator

```typescript
// validator.ts
export const createCommentValidator = [
  body('content')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('parent_comment_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent comment ID'),
  
  body('media_attachments')
    .optional()
    .isArray({ max: 4 })
    .withMessage('Maximum 4 media attachments for comments'),
  
  body('media_attachments.*.type')
    .optional()
    .isIn(['image', 'video', 'audio'])
    .withMessage('Media type must be image, video, or audio'),
  
  body('media_attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid media URL'),
];
```

### Update Post Validator

```typescript
// validator.ts
export const updatePostValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID'),
  
  body('content')
    .optional()
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'followers_only', 'mentioned_only', 'private'])
    .withMessage('Invalid visibility setting'),
  
  body('media_attachments')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 media attachments allowed'),
];
```

### Get Posts Query Validator

```typescript
// validator.ts
export const getPostsQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['created_at', 'likes_count', 'reposts_count'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Order must be ASC or DESC'),
  
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID'),
  
  query('visibility')
    .optional()
    .isIn(['public', 'followers_only', 'mentioned_only', 'private'])
    .withMessage('Invalid visibility'),
];
```

### Get Comments Query Validator

```typescript
// validator.ts
export const getCommentsQueryValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['created_at', 'likes_count'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Order must be ASC or DESC'),
];
```

### Get Likes Query Validator

```typescript
// validator.ts
export const getLikesQueryValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid post ID'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
];
```

### Request/Response Examples

#### Create Post Request

```json
{
  "content": "Hello world! This is my first post.",
  "visibility": "public",
  "media_attachments": [
    {
      "type": "image",
      "url": "https://cdn.example.com/images/photo.jpg",
      "thumbnail_url": "https://cdn.example.com/thumbnails/photo.jpg",
      "size": 2048000,
      "mime_type": "image/jpeg",
      "filename": "photo.jpg",
      "order_index": 0
    }
  ]
}
```

#### Create Post Response (201)

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "content": "Hello world! This is my first post.",
    "post_type": "image",
    "visibility": "public",
    "media_attachments": [
      {
        "type": "image",
        "url": "https://cdn.example.com/images/photo.jpg",
        "thumbnail_url": "https://cdn.example.com/thumbnails/photo.jpg",
        "size": 2048000,
        "mime_type": "image/jpeg",
        "filename": "photo.jpg",
        "order_index": 0
      }
    ],
    "likes_count": 0,
    "comments_count": 0,
    "reposts_count": 0,
    "quotes_count": 0,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

#### Quote Repost Request

```json
{
  "parent_post_id": "550e8400-e29b-41d4-a716-446655440002",
  "quote_text": "Great post! Totally agree with this.",
  "visibility": "public"
}
```

#### Create Comment Request

```json
{
  "content": "This is a great post!",
  "parent_comment_id": null
}
```

#### Get Posts Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "content": "Hello world!",
      "post_type": "text",
      "visibility": "public",
      "likes_count": 5,
      "comments_count": 2,
      "reposts_count": 1,
      "quotes_count": 0,
      "is_liked": false,
      "is_reposted": false,
      "is_bookmarked": false,
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "johndoe",
        "avatar": "https://cdn.example.com/avatars/john.jpg"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "content",
        "message": "Content must be between 1 and 5000 characters"
      }
    ]
  }
}
```

#### Error Response (401)

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Error Response (404)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Post not found"
  }
}
```

---

## Features Summary

| Feature | Table(s) | Description |
|---------|----------|-------------|
| **Posts** | `posts` | Main content with media support |
| **Comments** | `comments` | Nested comments on posts |
| **Likes** | `post_likes`, `comment_likes` | Like posts and comments |
| **Reposts** | `reposts` | Share posts without adding content |
| **Quote Posts** | `posts` (with `parent_post_id`) | Share posts with commentary |
| **Media** | `posts.media_attachments` | JSONB array for images/videos/audio |
| **Bookmarks** | `post_bookmarks` | Save posts for later |
| **Mentions** | `post_mentions` | Track `@mentions` for notifications |
| **Soft Delete** | `deleted_at` column | Preserve data while hiding content |
| **Visibility** | `visibility` enum | Control post access |

---

## Media Attachments Schema

The `media_attachments` JSONB column stores an array of media objects:

```json
[
  {
    "type": "image",
    "url": "https://cdn.example.com/images/photo.jpg",
    "thumbnail_url": "https://cdn.example.com/thumbnails/photo.jpg",
    "size": 2048000,
    "mime_type": "image/jpeg",
    "filename": "photo.jpg",
    "order_index": 0
  },
  {
    "type": "audio",
    "url": "https://cdn.example.com/audio/song.mp3",
    "duration": 180,
    "size": 5242880,
    "mime_type": "audio/mpeg",
    "filename": "song.mp3",
    "order_index": 1
  }
]
```

---

## Query Examples

### Get User Feed (Posts from followed users)

```sql
SELECT p.*, u.username, u.avatar
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (SELECT followed_id FROM follows WHERE follower_id = ?)
  AND p.visibility = 'public'
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 20 OFFSET ?;
```

### Get Post with Engagement Status

```sql
SELECT 
  p.*,
  u.username,
  u.avatar,
  EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked,
  EXISTS(SELECT 1 FROM reposts WHERE post_id = p.id AND user_id = ?) as is_reposted,
  EXISTS(SELECT 1 FROM post_bookmarks WHERE post_id = p.id AND user_id = ?) as is_bookmarked
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.id = ? AND p.deleted_at IS NULL;
```

### Get Comments for a Post

```sql
SELECT 
  c.*,
  u.username,
  u.avatar,
  EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.post_id = ? 
  AND c.parent_comment_id IS NULL 
  AND c.deleted_at IS NULL
ORDER BY c.created_at DESC;
```

### Get Quote Posts

```sql
SELECT 
  p.*,
  original.content as original_content,
  original_user.username as original_author
FROM posts p
JOIN posts original ON p.parent_post_id = original.id
JOIN users original_user ON original.user_id = original_user.id
WHERE p.parent_post_id IS NOT NULL
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

---

## Counter Update Strategy

The counters are denormalized for performance. Update them using:

**Increment on like:**
```sql
UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?;
```

**Decrement on unlike:**
```sql
UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?;
```

---

## Migration Commands

To create and run this migration:

```bash
# Create migration
npx db-migrate create create-posts-tables --sql-file

# Run migration
npx db-migrate up

# Rollback
npx db-migrate down
```

---

## Relationship Diagram

```
users (1)
  │
  ├── creates ───────────────> posts (N)
  │                              │
  │                              ├── has ─────> comments (N)
  │                              │                │
  │                              │                └── replied by ──> comments (N)
  │                              │
  │                              ├── quoted in ─> posts (N)
  │                              │
  │                              ├── has ─────> post_likes (N)
  │                              ├── has ─────> reposts (N)
  │                              ├── has ─────> post_mentions (N)
  │                              └── has ─────> post_bookmarks (N)
  │
  ├── creates ───────────────> comments (N)
  │                              │
  │                              └── has ─────> comment_likes (N)
  │
  ├── likes ─────────────────> post_likes (N)
  ├── likes ─────────────────> comment_likes (N)
  ├── reposts ───────────────> reposts (N)
  ├── bookmarks ─────────────> post_bookmarks (N)
  └── mentioned in ──────────> post_mentions (N)
```

---

## Notes

1. **Soft Delete**: Posts and comments use `deleted_at` for soft delete to preserve data integrity
2. **Media Storage**: Actual media files should be stored in cloud storage (S3, etc.), with URLs stored in `media_attachments`
3. **Indexes**: Strategic indexes added for common query patterns
4. **Constraints**: Unique constraints prevent duplicate likes, reposts, and bookmarks
5. **JSONB**: `media_attachments` uses JSONB for flexible media metadata storage
