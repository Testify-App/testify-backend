CREATE TABLE notification_preferences (
  user_id           VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  likes             BOOLEAN NOT NULL DEFAULT TRUE,
  comments_replies  BOOLEAN NOT NULL DEFAULT TRUE,
  mentions          BOOLEAN NOT NULL DEFAULT TRUE,
  new_followers     BOOLEAN NOT NULL DEFAULT TRUE,
  reposts           BOOLEAN NOT NULL DEFAULT TRUE,
  circle_activity   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
