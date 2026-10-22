CREATE TYPE story_reply_option AS ENUM ('everyone', 'circle_only', 'nobody');

-- Global default, sibling table of messaging_privacy_settings — same shape,
-- same conventions, lives in the messaging module.
CREATE TABLE story_reply_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  who_can_reply story_reply_option NOT NULL DEFAULT 'everyone',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-story override. NULL = inherit the author's global default, resolved
-- live at reply time (not frozen at story-creation time). Set once at
-- creation, not editable afterward.
ALTER TABLE stories ADD COLUMN allow_replies BOOLEAN NULL;

-- Quote attached to a DM reply. No FK on quoted_story_id — same constraint
-- as reply_to_message_id and message_reactions.message_id: messages is
-- partitioned by created_at, Postgres doesn't support a FK from another
-- table into a partitioned table's key here. Enforced at the app layer.
-- quoted_story_snapshot freezes the content at reply time since stories
-- hard-delete on 24h expiry — the quote must survive that deletion.
ALTER TABLE messages ADD COLUMN quoted_story_id VARCHAR NULL;
ALTER TABLE messages ADD COLUMN quoted_story_snapshot JSONB NULL;
