ALTER TABLE messages DROP COLUMN quoted_story_snapshot;
ALTER TABLE messages DROP COLUMN quoted_story_id;
ALTER TABLE stories DROP COLUMN allow_replies;
DROP TABLE story_reply_settings;
DROP TYPE story_reply_option;
