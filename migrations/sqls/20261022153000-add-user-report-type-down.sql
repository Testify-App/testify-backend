ALTER TABLE reports DROP COLUMN context_conversation_id;

-- Postgres does not support removing a value from an enum type (no DROP VALUE),
-- and this migration cannot run in the same transaction as code that already
-- used 'user' in a reports row. If you need to fully roll this back:
--   1. Update or delete any reports rows with entity_type = 'user'.
--   2. Manually recreate report_entity_type without 'user' and re-point the
--      reports.entity_type column at it (requires a brief table rewrite).
DO $$
BEGIN
  RAISE EXCEPTION 'Cannot automatically remove ''user'' from report_entity_type — see comment in this file for manual recovery steps.';
END $$;
