CREATE TABLE user_topic_affinity (
  user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hashtag_id VARCHAR NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  score      NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, hashtag_id)
);

CREATE TABLE user_creator_affinity (
  user_id    VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, creator_id)
);

-- Supports the nightly prune of rows whose events have aged out of the window.
CREATE INDEX idx_user_topic_affinity_updated ON user_topic_affinity (updated_at);
CREATE INDEX idx_user_creator_affinity_updated ON user_creator_affinity (updated_at);
