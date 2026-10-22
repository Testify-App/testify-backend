-- Per-user "delete for me" on an individual message. Deliberately separate
-- from messages.is_unsent (which is shared, visible-to-both-participants
-- state) — a delete here only ever affects the deleting user's own view.
-- No FK on message_id: messages is partitioned by created_at and Postgres
-- does not support a FK from another table into a partitioned table's key
-- here (same constraint already applies to message_reactions); referential
-- integrity is enforced at the application layer instead.
CREATE TABLE message_deletions (
  message_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX idx_message_deletions_user ON message_deletions (user_id);
