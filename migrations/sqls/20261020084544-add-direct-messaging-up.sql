CREATE TYPE conversation_type AS ENUM ('direct');

CREATE TABLE conversations (
  id              VARCHAR PRIMARY KEY DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  type            conversation_type NOT NULL DEFAULT 'direct',
  last_message_id VARCHAR NULL,
  last_message_at TIMESTAMPTZ NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- One row per participant per conversation. For a 1:1 DM this is always exactly
-- 2 rows. Modeling it this way (not a bare user_a/user_b pair on conversations)
-- is what lets this same table support group DMs later without a schema change.
CREATE TABLE conversation_participants (
  conversation_id       VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id               VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id  VARCHAR NULL,
  last_read_at          TIMESTAMPTZ NULL,
  joined_at             TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX idx_conversation_participants_user ON conversation_participants (user_id);

CREATE TYPE message_content_type AS ENUM ('text', 'image', 'video', 'audio');

-- Partitioned by month: at scale this is the single highest-volume table in the
-- system, and Postgres partitioning cannot be applied retroactively without a
-- full table rewrite. created_at must be part of the primary key for a
-- partitioned table, so the PK here is (id, created_at), not id alone.
--
-- reply_to_message_id has no FK: Postgres does not support a plain foreign key
-- into a partitioned table's key from another table in this setup. Referential
-- integrity for replies is enforced at the application layer instead.
CREATE TABLE messages (
  id                    VARCHAR NOT NULL DEFAULT LOWER(CAST(uuid_generate_v1mc() AS VARCHAR(50))),
  conversation_id       VARCHAR NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id             VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reply_to_message_id   VARCHAR NULL,
  content_type          message_content_type NOT NULL DEFAULT 'text',
  content               TEXT NULL,
  media_url             TEXT NULL,
  is_unsent             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Current + next month's partitions. A monthly job must create the next
-- partition ahead of time — Postgres does not do this automatically, and an
-- INSERT with no matching partition fails outright.
CREATE TABLE messages_y2026m10 PARTITION OF messages
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE messages_y2026m11 PARTITION OF messages
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE INDEX idx_messages_conversation_created ON messages (conversation_id, created_at DESC);

-- Not partitioned: reaction volume is a small fraction of message volume, and
-- this table needs a real FK to messages, which a partitioned parent complicates.
-- message_id has no FK for the same partitioned-parent reason as reply_to_message_id
-- above; enforced at the application layer.
CREATE TABLE message_reactions (
  message_id  VARCHAR NOT NULL,
  user_id     VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       VARCHAR(16) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX idx_message_reactions_message ON message_reactions (message_id);
