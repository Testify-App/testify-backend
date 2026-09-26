-- Reverse of the drift reconciliation.
--
-- Deliberately does NOT drop users.deleted_at or posts.report_count: the
-- application queries both, so removing them breaks login immediately. Dropping
-- a column also destroys its data irreversibly. If you genuinely need them gone,
-- do it deliberately and by hand.
DROP TABLE IF EXISTS story_views;
DROP TABLE IF EXISTS stories;
