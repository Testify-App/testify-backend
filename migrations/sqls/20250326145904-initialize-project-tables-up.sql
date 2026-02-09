CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS CITEXT;

DROP TYPE IF EXISTS status;
CREATE TYPE status AS ENUM (
  'inactive',
  'active',
  'deactivated',
  'pending',
  'failed'
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  first_name CITEXT NULL,
  middle_name CITEXT NULL,
  last_name CITEXT NULL,
  email CITEXT UNIQUE NULL,
  password VARCHAR(255) NULL,
  country_code VARCHAR NULL,
  phone_number VARCHAR UNIQUE NULL,
  dob DATE NULL,
  state_of_origin VARCHAR NULL,
  status status DEFAULT 'inactive',
  avatar TEXT NULL,
  verification_code VARCHAR,
  verification_code_expiry_time TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT NULL,
  username VARCHAR UNIQUE NULL,
  password_changed_count INTEGER DEFAULT 0,
  session_id VARCHAR DEFAULT NULL,
  last_login TIMESTAMPTZ DEFAULT NULL,
  device_token VARCHAR DEFAULT NULL,
  hash_id_key TEXT NULL,
  bio TEXT NULL,
  instagram TEXT NULL,
  twitter TEXT NULL,
  youtube TEXT NULL,
  terms_and_condition BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL
);

DROP TYPE IF EXISTS post_type;
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'mixed');

DROP TYPE IF EXISTS post_visibility;
CREATE TYPE post_visibility AS ENUM ('public', 'followers_only', 'mentioned_only', 'private');

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

CREATE TABLE IF NOT EXISTS post_likes (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comment_likes (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  comment_id VARCHAR NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS reposts (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_mentions (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mention_type VARCHAR DEFAULT 'content',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, mentioned_user_id)
);

CREATE TABLE IF NOT EXISTS post_bookmarks (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  post_id VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

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
