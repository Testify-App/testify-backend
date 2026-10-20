-- Postgres has no DROP VALUE for enums. Rolling back this migration requires
-- manually recreating report_entity_type without 'message' (and migrating any
-- rows that used it) — intentionally not automated here since that's a
-- destructive, data-dependent operation that shouldn't run unattended.
DO $$
BEGIN
  RAISE EXCEPTION 'Cannot auto-rollback: Postgres does not support removing an enum value. See comment in this file for the manual recovery steps.';
END $$;
