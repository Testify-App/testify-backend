CREATE TYPE messaging_privacy_option AS ENUM ('everyone', 'following', 'nobody');

CREATE TABLE messaging_privacy_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  who_can_message messaging_privacy_option NOT NULL DEFAULT 'everyone',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
