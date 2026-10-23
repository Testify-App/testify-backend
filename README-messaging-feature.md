# Messaging Feature Implementation Guide

## Overview

This covers everything built on top of the core Direct Messaging feature in this change set: privacy controls over who can message you, handling of deleted/deactivated accounts inside conversations, reporting a message or a user from a conversation, and private replies to Circle stories delivered as Direct Messages.

Story replies are **not** a separate messaging system — they extend the existing `sendMessage` send path with one optional field (`quoted_story_id`). The same send/delivery mechanism used for a normal DM is reused as-is.

## Feature Requirements

### Core Capabilities
1. **Messaging privacy** — choose who can send you a DM: everyone, people you follow, or nobody
2. **Deleted/deactivated account handling** — conversations with such accounts stay readable but become read-only
3. **Report a message or a user** — from inside a conversation, with optional conversation context for moderators
4. **Story replies** — reply privately to a Circle story; delivered as a DM, gated by a global default with a per-story override

### User Stories

**As a Testify user,**
I want to control who can send me Direct Messages,
so that I can manage who contacts me privately.

**As a Testify user,**
I want conversations with deleted or deactivated accounts handled clearly,
so that I understand why I can no longer interact with that user while retaining appropriate history.

**As a Testify user,**
I want to report an inappropriate Direct Message or user,
so that harmful behavior can be reviewed by the moderation team.

**As a Testify user,**
I want to reply privately to another user's Circle story,
so that I can respond directly and continue the conversation through Direct Messages.

### Acceptance Criteria

#### Messaging privacy
- Three options: Everyone, People I Follow, Nobody — selectable and saved immediately
- Takes effect immediately, including inside existing conversations — previous messages stay visible, but new sends are blocked once a sender no longer qualifies
- Blocking always overrides the privacy setting in either direction
- `GET /conversations` exposes a `can_send_message` flag per conversation so the composer can disable itself without polling
- Changing the setting pushes a live `conversation:permission-changed` socket event to every existing conversation partner

#### Deleted/deactivated accounts
- The other participant's identity is redacted to "Deleted Account" once their account is deleted or deactivated
- Message history remains visible; the composer is disabled (`can_send_message: false`, `restriction_reason: "account_unavailable"`)
- Starting a *new* conversation with a deleted/deactivated account is blocked outright
- Inbox and conversation screens never error on a deleted participant

#### Reporting
- `entity_type: 'user'` added alongside the existing `post`/`comment`/`message` types
- Reporting a user from a conversation can cite `context_conversation_id` for moderator context — only if the reporter is actually a participant in it
- Duplicate reports of the same entity by the same reporter are rejected
- The reported user is never notified, and reporting never auto-blocks or deletes anything

#### Story replies
- A story's author sets a global default for who can reply privately to their stories (Everyone / Circle only / Nobody)
- Each story can override that default at creation time
- A reply can be quote-only (no typed text required)
- The quoted content is frozen at reply time, so it still renders correctly after the source story expires and is deleted 24 hours later

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|--------------|
| GET | `/messaging-settings` | Get "who can message me" privacy setting |
| PUT | `/messaging-settings` | Update "who can message me" privacy setting |
| GET | `/story-reply-settings` | Get "who can reply to my stories" default |
| PUT | `/story-reply-settings` | Update "who can reply to my stories" default |
| POST | `/stories/:storyId/reply` | Reply privately to a story — delivered as a DM |
| POST | `/reports` | Report a post, comment, message, or user (extended) |

Existing DM endpoints (`POST /conversations`, `POST /conversations/:id/messages`, etc.) are unchanged in shape but now enforce the privacy setting and account-availability checks on every call.

## Database Schema

### New Table: messaging_privacy_settings
```sql
CREATE TYPE messaging_privacy_option AS ENUM ('everyone', 'following', 'nobody');

CREATE TABLE messaging_privacy_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  who_can_message messaging_privacy_option NOT NULL DEFAULT 'everyone',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### New Table: story_reply_settings
```sql
CREATE TYPE story_reply_option AS ENUM ('everyone', 'circle_only', 'nobody');

CREATE TABLE story_reply_settings (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  who_can_reply story_reply_option NOT NULL DEFAULT 'everyone',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Altered Table: stories
```sql
ALTER TABLE stories ADD COLUMN allow_replies BOOLEAN NULL;
-- NULL = inherit the author's global default, resolved live at reply time
```

### Altered Table: messages
```sql
ALTER TABLE messages ADD COLUMN quoted_story_id VARCHAR NULL;
ALTER TABLE messages ADD COLUMN quoted_story_snapshot JSONB NULL;
-- No FK on quoted_story_id — messages is partitioned by created_at, and
-- Postgres doesn't support a FK into a partitioned table's key here.
-- The snapshot is frozen at reply time so the quote survives the story's
-- 24-hour hard-delete.
```

### Altered Table: reports
```sql
ALTER TYPE report_entity_type ADD VALUE 'user';
ALTER TABLE reports ADD COLUMN context_conversation_id VARCHAR NULL;
```

## Permission Model

Both privacy features share the same resolution shape:

```
block check (either direction) — always wins
  → per-entity override, if one exists (story's allow_replies)
    → the recipient/author's global default setting
      → relationship check (follows, for messaging; Circle, for stories)
```

For messaging, "follows" means the **recipient** follows the sender. For stories, "Circle" means the **author** added the replier to their own Circle — in both cases, the gate is the recipient's own relationship list, not the sender's.

## Real-time Events (Socket.IO)

| Event | Trigger |
|-------|---------|
| `conversation:permission-changed` | A user updates their messaging privacy setting — pushed to every existing conversation partner |
| `message:new` | Any new message, including a story reply — no new event needed, the quote rides along in the existing payload |
