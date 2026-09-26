-- Reconcile schema drift caused by editing an already-applied migration.
--
-- WHY THIS EXISTS
--
-- `20250326145904-initialize-project-tables` was edited in place after it had
-- already run. db-migrate records applied migrations by NAME, so it reported
-- "No migrations to run" on every subsequent deploy while the SQL file kept
-- growing. The database was therefore permanently behind the file, and the
-- application queried columns and tables that did not exist:
--
--   ERROR: column "deleted_at" does not exist   (login, and every soft-delete)
--
-- Diffed the file against the live database on 2026-09-26. Missing:
--
--   tables  : stories, story_views
--   columns : users.deleted_at, posts.report_count
--
-- Every definition below is copied VERBATIM from the original migration so the
-- two agree exactly. Nothing here is invented.
--
-- Written to be idempotent (IF NOT EXISTS everywhere) so it is safe against a
-- database that already has some of these — a fresh database gets them from the
-- original migration, and this then does nothing.

-- --------------------------------------------------------------------------
-- Enum required by stories.content_type
--
-- NOT `DROP TYPE IF EXISTS` first, unlike the original. Dropping a type in use
-- would cascade to columns that depend on it.
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'story_content_type') THEN
    CREATE TYPE story_content_type AS ENUM ('text', 'image', 'video');
  END IF;
END
$$;

-- --------------------------------------------------------------------------
-- Missing columns
-- --------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0;

-- --------------------------------------------------------------------------
-- Missing tables
-- --------------------------------------------------------------------------
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

-- --------------------------------------------------------------------------
-- Indexes, matching the original
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stories_user_id       ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at    ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id  ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer_id ON story_views(viewer_id);
