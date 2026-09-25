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

DROP TYPE IF EXISTS user_connection_status;
CREATE TYPE user_connection_status AS ENUM (
  'inactive',
  'accepted',
  'deactivated',
  'pending'
);

DROP TYPE IF EXISTS post_status;
CREATE TYPE post_status AS ENUM (
  'deleted',
  'archived',
  'draft',
  'published',
  'scheduled',
  'failed',
  'flagged'
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
  header_image TEXT NULL,
  display_name TEXT NULL,
  verification_code VARCHAR,
  verification_code_expiry_time TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT NULL,
  username VARCHAR UNIQUE NULL,
  password_changed_count INTEGER DEFAULT 0,
  session_id VARCHAR DEFAULT NULL,
  last_login TIMESTAMPTZ DEFAULT NULL,
  fcm_token VARCHAR DEFAULT NULL,
  hash_id_key TEXT NULL,
  bio TEXT NULL,
  instagram TEXT NULL,
  twitter TEXT NULL,
  youtube TEXT NULL,
  terms_and_condition BOOLEAN DEFAULT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(username, '') || ' ' ||
      coalesce(display_name, '') || ' ' ||
      coalesce(bio, '')
    )
  ) STORED
);

DROP TYPE IF EXISTS post_type;
CREATE TYPE post_type AS ENUM ('text', 'image', 'video', 'audio', 'mixed');

DROP TYPE IF EXISTS post_visibility;
CREATE TYPE post_visibility AS ENUM ('public', 'followers_only', 'mentioned_only', 'private', 'circle_only');

CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id VARCHAR NULL,
  content TEXT NULL,
  post_type post_type DEFAULT 'text',
  visibility post_visibility DEFAULT 'public',
  media_attachments JSONB DEFAULT '[]',
  parent_post_id VARCHAR NULL REFERENCES posts(id) ON DELETE CASCADE,
  quote_text TEXT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  reposts_count INTEGER DEFAULT 0,
  quotes_count INTEGER DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deleted_by VARCHAR NULL REFERENCES users(id),
  content_flags JSONB DEFAULT NULL,
  status post_status DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(content, ''))
  ) STORED
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

CREATE TABLE IF NOT EXISTS user_follows (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  follower_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS user_connections (
  id VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() As VARCHAR(50))),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connected_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status user_connection_status DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id)
);

-- hashtags: canonical tag registry (one row per unique tag)
CREATE TABLE hashtags (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  tag         CITEXT       NOT NULL UNIQUE,
  posts_count INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hashtags_tag         ON hashtags (tag);
CREATE INDEX idx_hashtags_posts_count ON hashtags (posts_count DESC);

-- post_hashtags: junction table linking posts to their hashtags
CREATE TABLE post_hashtags (
  post_id     VARCHAR(36)  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id  VARCHAR(36)  NOT NULL REFERENCES hashtags(id),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX idx_post_hashtags_post_id    ON post_hashtags (post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags (hashtag_id);

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

-- User follows Indexes
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);

-- User connections Indexes
CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX idx_user_connections_created_at ON user_connections(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_posts_search ON posts USING GIN (search_vector);
CREATE INDEX idx_users_search ON users USING GIN (search_vector);

-- Communities
DROP TYPE IF EXISTS community_visibility;
CREATE TYPE community_visibility AS ENUM ('public', 'private');

CREATE TABLE communities (
  id            VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  owner_id      VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  avatar        TEXT,
  cover_image   TEXT,
  visibility    community_visibility DEFAULT 'public',
  rules         JSONB DEFAULT '[]',
  members_count INTEGER DEFAULT 1,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'C')
  ) STORED,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_communities_owner_id        ON communities(owner_id);
CREATE INDEX idx_communities_created_at      ON communities(created_at DESC);
CREATE INDEX idx_communities_members_count   ON communities(members_count DESC);
CREATE INDEX idx_communities_search          ON communities USING GIN (search_vector);

DROP TYPE IF EXISTS community_member_status;
CREATE TYPE community_member_status AS ENUM ('pending', 'accepted');

CREATE TABLE community_members (
  id           VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  community_id VARCHAR NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       community_member_status DEFAULT 'accepted',
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_user_id      ON community_members(user_id);
CREATE INDEX idx_community_members_status       ON community_members(community_id, status);

-- Add community FK on posts now that communities table exists
ALTER TABLE posts ADD CONSTRAINT fk_posts_community_id
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_community_id ON posts(community_id) WHERE community_id IS NOT NULL;
CREATE INDEX idx_posts_community_feed ON posts(community_id, is_pinned DESC, created_at DESC) WHERE community_id IS NOT NULL;

-- Community bans
CREATE TABLE community_bans (
  id           VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  community_id VARCHAR NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

CREATE INDEX idx_community_bans_community_id ON community_bans(community_id);
CREATE INDEX idx_community_bans_user_id      ON community_bans(user_id);

-- Community reports
DROP TYPE IF EXISTS community_report_entity_type;
CREATE TYPE community_report_entity_type AS ENUM ('community', 'testimony');

DROP TYPE IF EXISTS community_report_status;
CREATE TYPE community_report_status AS ENUM ('pending', 'reviewed', 'dismissed');

CREATE TABLE community_reports (
  id          VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  community_id VARCHAR NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  reporter_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type  community_report_entity_type NOT NULL,
  entity_id    VARCHAR,
  reason       TEXT,
  status       community_report_status DEFAULT 'pending',
  reviewed_by  VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, reporter_id, entity_type, entity_id)
);

CREATE INDEX idx_community_reports_community_id ON community_reports(community_id);
CREATE INDEX idx_community_reports_status       ON community_reports(community_id, status);

-- Notifications
CREATE TABLE notifications (
  id          VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  user_id     VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id    VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  type        VARCHAR NOT NULL,
  entity_type VARCHAR,
  entity_id   VARCHAR,
  data        JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT FALSE,
  read_at     TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Stories
DROP TYPE IF EXISTS story_content_type;
CREATE TYPE story_content_type AS ENUM ('text', 'image', 'video');

CREATE TABLE IF NOT EXISTS stories (
  id                VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  user_id           VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type      story_content_type NOT NULL,
  media_url         TEXT NULL,
  thumbnail_url     TEXT NULL,
  text_content      TEXT NULL,
  background_style  JSONB DEFAULT NULL,
  duration          INTEGER NULL,
  views_count       INTEGER NOT NULL DEFAULT 0,
  deleted_at        TIMESTAMPTZ DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS story_views (
  id          VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  story_id    VARCHAR NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id   VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_stories_user_id       ON stories(user_id);
CREATE INDEX idx_stories_expires_at    ON stories(expires_at);
CREATE INDEX idx_story_views_story_id  ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);

-- Global content reports (posts & comments, independent of communities)
DROP TYPE IF EXISTS report_entity_type;
CREATE TYPE report_entity_type AS ENUM ('post', 'comment');

DROP TYPE IF EXISTS report_status;
CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'resolved');

DROP TYPE IF EXISTS report_moderator_action;
CREATE TYPE report_moderator_action AS ENUM ('no_action', 'content_removed', 'user_action_taken');

CREATE TABLE IF NOT EXISTS reports (
  id                VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  entity_type       report_entity_type NOT NULL,
  entity_id         VARCHAR NOT NULL,
  content_owner_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_id       VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason            VARCHAR NOT NULL,
  details           TEXT NULL,
  status            report_status NOT NULL DEFAULT 'pending',
  moderator_action   report_moderator_action NOT NULL DEFAULT 'no_action',
  reviewed_by       VARCHAR NULL REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, reporter_id)
);

CREATE INDEX idx_reports_status        ON reports(status);
CREATE INDEX idx_reports_entity        ON reports(entity_type, entity_id);
CREATE INDEX idx_reports_content_owner ON reports(content_owner_id);
CREATE INDEX idx_reports_created_at    ON reports(created_at DESC);

-- User blocking
CREATE TABLE IF NOT EXISTS user_blocks (
  id          VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  blocker_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked_id ON user_blocks(blocked_id);
