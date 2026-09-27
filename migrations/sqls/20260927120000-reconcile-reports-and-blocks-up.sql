-- Reconcile schema drift caused by editing an already-applied migration.
--
-- WHY THIS EXISTS
--
-- The same trap as 20260926120000, hit a second time by a different author.
--
-- `20250326145904-initialize-project-tables` was edited in place again — in
-- commit d16f52e, which added users.is_admin, the reports and user_blocks
-- tables, and three enums. db-migrate records applied migrations by NAME, not by
-- content, so that migration will never run again on any database that has
-- already seen it. The deployed database is therefore behind the file, exactly
-- as before.
--
-- Verified against the live database on 2026-09-27, over SSM from the instance.
-- A query for each object returned NOTHING — every one is missing:
--
--   tables  : reports, user_blocks
--   columns : users.is_admin
--   enums   : report_entity_type, report_status, report_moderator_action
--
-- Without this migration, src/modules/reports/* and
-- src/shared/middlewares/admin.middleware.ts fail on every request:
--
--   ERROR: relation "reports" does not exist
--   ERROR: column "is_admin" does not exist
--
-- Every definition below is copied VERBATIM from d16f52e's SQL so the two
-- agree exactly. Nothing here is invented, and no design decision is taken —
-- the shape of these tables belongs to whoever wrote them.
--
-- TWO DELIBERATE DEVIATIONS, both for safety on a live database:
--
--   1. Enums are created inside an IF NOT EXISTS guard rather than with
--      `DROP TYPE IF EXISTS` first. Dropping a type that columns depend on
--      cascades to those columns; the original can afford it only because it
--      runs against an empty database.
--
--   2. Indexes use IF NOT EXISTS. The originals do not, so on a FRESH database
--      — where 20250326145904 creates all of this — a bare CREATE INDEX here
--      would abort the migration on a duplicate name.
--
-- The whole file is idempotent as a result: on a fresh database it finds
-- everything already present and does nothing.

-- --------------------------------------------------------------------------
-- Enums required by the reports table
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_entity_type') THEN
    CREATE TYPE report_entity_type AS ENUM ('post', 'comment');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'resolved');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_moderator_action') THEN
    CREATE TYPE report_moderator_action AS ENUM ('no_action', 'content_removed', 'user_action_taken');
  END IF;
END
$$;

-- --------------------------------------------------------------------------
-- Missing column
--
-- NOT NULL with a DEFAULT, so existing rows are backfilled to FALSE rather
-- than the statement failing on them.
-- --------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- --------------------------------------------------------------------------
-- Global content reports (posts & comments, independent of communities)
-- --------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_reports_status        ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity        ON reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_content_owner ON reports(content_owner_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at    ON reports(created_at DESC);

-- --------------------------------------------------------------------------
-- User blocking
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_blocks (
  id          VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  blocker_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);
