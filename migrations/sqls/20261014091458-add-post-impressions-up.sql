CREATE TYPE post_impression_source AS ENUM ('feed', 'profile', 'community', 'search');

CREATE TABLE post_impressions (
  id          VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  post_id     VARCHAR NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source      post_impression_source NOT NULL,
  dwell_ms    INTEGER,
  skipped     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_impressions_user_created ON post_impressions (user_id, created_at DESC);
CREATE INDEX idx_post_impressions_post ON post_impressions (post_id);
