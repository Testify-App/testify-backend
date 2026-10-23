-- Reverts the per-story reply override: reply permission is governed solely
-- by the author's global story_reply_settings default from here on.
ALTER TABLE stories DROP COLUMN allow_replies;
