-- Reverse of the drift reconciliation.
--
-- Deliberately does NOT drop users.is_admin: admin.middleware.ts reads it on
-- every privileged request, so removing it breaks admin access immediately, and
-- dropping a column destroys its data irreversibly. If you genuinely need it
-- gone, do it deliberately and by hand.
--
-- The enums are left in place too. Dropping a type is only safe once nothing
-- references it, and the tables below may have been recreated by a later
-- migration. Leaving three unused types costs nothing.
DROP TABLE IF EXISTS user_blocks;
DROP TABLE IF EXISTS reports;
