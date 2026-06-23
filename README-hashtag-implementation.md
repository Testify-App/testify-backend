# Hashtag Feature - Implementation Specification

## Overview

This document covers the full implementation of hashtag support for Testify — from database schema to API endpoints. Hashtags allow users to embed `#tags` directly in their testimony captions, making posts discoverable through themed feeds and a trending system.

Architecture approach: **normalized junction tables**, mirroring the existing `post_mentions` pattern. No JSONB arrays on the posts table, no regex scanning at query time.

## Table of Contents

1. [Database Schema](#database-schema)
2. [Migration SQL](#migration-sql)
3. [Extraction Logic](#extraction-logic)
4. [Write Path](#write-path)
5. [Query Examples](#query-examples)
6. [API Endpoints](#api-endpoints)
7. [Validation Rules](#validation-rules)
8. [File Structure](#file-structure)
9. [Scale Notes](#scale-notes)
10. [Open Questions](#open-questions)

---

## Database Schema

### 1. `hashtags` Table

One row per unique tag across the platform. Acts as the canonical tag registry.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(36)` | PRIMARY KEY | UUID v1mc, matches existing pattern |
| `tag` | `CITEXT` | NOT NULL, UNIQUE | Stored without `#`. CITEXT makes `#Healing` and `#healing` the same row |
| `posts_count` | `INTEGER` | NOT NULL, DEFAULT 0 | Pre-computed counter for trending. Incremented on post create, decremented on soft-delete |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | When this tag first appeared on the platform |

**Indexes:**
- `idx_hashtags_tag` — on `tag` (supports prefix search for typeahead)
- `idx_hashtags_posts_count` — on `posts_count DESC` (supports trending query without GROUP BY)

**Why CITEXT:** PostgreSQL's case-insensitive text type deduplicates `#Healing`, `#healing`, and `#HEALING` into a single row at the storage level — no application-side normalization required beyond stripping the `#`.

---

### 2. `post_hashtags` Table

Junction table linking posts to their hashtags. The reverse index for "give me all posts with tag X."

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `post_id` | `VARCHAR(36)` | NOT NULL, FK → posts(id) ON DELETE CASCADE | Hard delete on posts cascades to this table |
| `hashtag_id` | `VARCHAR(36)` | NOT NULL, FK → hashtags(id) | |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT NOW() | |

**Primary Key:** `(post_id, hashtag_id)` — prevents duplicates at DB level.

**Indexes:**
- `idx_post_hashtags_post_id` — for "what hashtags does this post have?"
- `idx_post_hashtags_hashtag_id` — for "what posts have this hashtag?" (the hot query path)

---

## Migration SQL

Create a new migration file following the existing `db-migrate` convention:

```sql
-- migrations/sqls/<timestamp>-add-hashtag-tables-up.sql

-- hashtags: canonical tag registry
CREATE TABLE hashtags (
  id          VARCHAR(36)  PRIMARY KEY DEFAULT uuid_generate_v1mc(),
  tag         CITEXT       NOT NULL UNIQUE,
  posts_count INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hashtags_tag         ON hashtags (tag);
CREATE INDEX idx_hashtags_posts_count ON hashtags (posts_count DESC);

-- post_hashtags: junction table
CREATE TABLE post_hashtags (
  post_id     VARCHAR(36)  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id  VARCHAR(36)  NOT NULL REFERENCES hashtags(id),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX idx_post_hashtags_post_id    ON post_hashtags (post_id);
CREATE INDEX idx_post_hashtags_hashtag_id ON post_hashtags (hashtag_id);
```

**Down migration:**

```sql
-- migrations/sqls/<timestamp>-add-hashtag-tables-down.sql

DROP TABLE IF EXISTS post_hashtags;
DROP TABLE IF EXISTS hashtags;
```

---

## Extraction Logic

Add a private `extractHashtags()` method to `PostsRepositoryImpl` in `src/modules/posts/repositories.ts`, directly alongside the existing `extractMentions()`:

```typescript
private extractHashtags(content: string): string[] {
  const regex = /#([a-zA-Z0-9]+)/g;
  const matches = content.match(regex) ?? [];
  const unique = [...new Set(
    matches.map(m => m.substring(1).toLowerCase())
  )];
  return unique.slice(0, 10); // hard cap; validator already rejected >10
}
```

**Rules enforced:**
- Characters: letters and numbers only (`[a-zA-Z0-9]`) — no spaces, no special symbols
- Deduplication: `Set` removes repeated tags within the same post
- Normalization: `.toLowerCase()` — storage is always lowercase; CITEXT handles query-time case-insensitivity
- Limit: sliced to 10 max (the Joi validator catches this first; the slice is a safety net)

---

## Write Path

### Post creation

All hashtag operations happen **inside the existing `db.tx()` transaction** in `createPost`. Nothing is committed unless the entire block succeeds.

```typescript
// Inside db.tx() in posts.repository.ts

// 1. Insert the post (existing)
const post = await t.one(queries.createPost, [...]);

// 2. Extract and persist hashtags (new)
const tags = this.extractHashtags(post.content ?? '');

for (const tag of tags) {
  // Upsert the tag; increment count if it already exists
  const hashtag = await t.one(queries.upsertHashtag, [tag]);
  // Link the tag to this post
  await t.none(queries.createPostHashtag, [post.id, hashtag.id]);
}

// 3. Extract and persist mentions (existing, unchanged)
const mentions = this.extractMentions(post.content ?? '');
// ...
```

### Post soft-delete

When `deleted_at` is set, decrement `posts_count` for every tag that was on the post:

```typescript
// In softDeletePost — after setting deleted_at
const tagIds = await t.map(
  queries.getHashtagIdsByPostId,
  [postId],
  (row) => row.hashtag_id
);

for (const tagId of tagIds) {
  await t.none(queries.decrementHashtagCount, [tagId]);
}
// post_hashtags rows are NOT deleted on soft-delete — only on hard delete (CASCADE handles that)
```

### Post update

When content changes, re-sync hashtags atomically:

```typescript
// In updatePost — if content is being updated
if (dto.content) {
  // Remove all existing hashtag links for this post
  await t.none(queries.deletePostHashtags, [postId]);

  // Decrement counts for the old tags
  for (const tagId of oldTagIds) {
    await t.none(queries.decrementHashtagCount, [tagId]);
  }

  // Insert the new set
  const newTags = this.extractHashtags(dto.content);
  for (const tag of newTags) {
    const hashtag = await t.one(queries.upsertHashtag, [tag]);
    await t.none(queries.createPostHashtag, [postId, hashtag.id]);
  }
}
```

---

## Query Examples

Add the following to `src/modules/posts/query.ts` and a new `src/modules/hashtags/query.ts`:

```typescript
// posts/query.ts additions

upsertHashtag: `
  INSERT INTO hashtags (tag)
  VALUES ($1)
  ON CONFLICT (tag) DO UPDATE
    SET posts_count = hashtags.posts_count + 1
  RETURNING id, tag, posts_count;
`,

createPostHashtag: `
  INSERT INTO post_hashtags (post_id, hashtag_id)
  VALUES ($1, $2)
  ON CONFLICT (post_id, hashtag_id) DO NOTHING;
`,

decrementHashtagCount: `
  UPDATE hashtags
  SET posts_count = GREATEST(posts_count - 1, 0)
  WHERE id = $1;
`,

deletePostHashtags: `
  DELETE FROM post_hashtags WHERE post_id = $1;
`,

getHashtagIdsByPostId: `
  SELECT hashtag_id FROM post_hashtags WHERE post_id = $1;
`,
```

```typescript
// hashtags/query.ts

export default {

  getHashtagByTag: `
    SELECT id, tag, posts_count, created_at
    FROM hashtags
    WHERE tag = $1;
  `,

  // Hashtag feed — all public posts under a given tag
  getPostsByHashtag: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id       as user_id,
      u.username,
      u.display_name,
      u.avatar,
      ARRAY_AGG(h2.tag ORDER BY h2.tag) as hashtags
    FROM post_hashtags ph
    JOIN hashtags h    ON ph.hashtag_id = h.id
    JOIN posts p       ON ph.post_id = p.id
    JOIN users u       ON p.user_id = u.id
    LEFT JOIN post_hashtags ph2 ON ph2.post_id = p.id
    LEFT JOIN hashtags h2       ON ph2.hashtag_id = h2.id
    WHERE h.tag = $3
      AND p.deleted_at IS NULL
      AND p.parent_post_id IS NULL
      AND (p.visibility = 'public' OR p.user_id = $4)
    GROUP BY p.id, u.id
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  // Trending — reads from the pre-computed posts_count counter, no GROUP BY
  getTrendingHashtags: `
    SELECT id, tag, posts_count, created_at
    FROM hashtags
    WHERE posts_count > 0
    ORDER BY posts_count DESC
    LIMIT $1;
  `,

  // Typeahead — prefix search for autocomplete while user is typing
  searchHashtagsByPrefix: `
    SELECT tag, posts_count
    FROM hashtags
    WHERE tag ILIKE $1 || '%'
    ORDER BY posts_count DESC
    LIMIT 10;
  `,

};
```

---

## API Endpoints

### New module: `src/modules/hashtags/`

All new routes live under `/api/v1/hashtags`.

---

#### `GET /api/v1/hashtags?q=:prefix`

Typeahead autocomplete — returns matching tags while the user is typing.

**Auth:** Optional

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Prefix to match against tag names |

**Response:**
```json
{
  "status": "success",
  "data": {
    "hashtags": [
      { "tag": "healing", "posts_count": 1482 },
      { "tag": "health", "posts_count": 834 },
      { "tag": "healed", "posts_count": 291 }
    ]
  }
}
```

---

#### `GET /api/v1/hashtags/trending`

Returns the top hashtags by post count platform-wide.

**Auth:** Optional

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | How many trending tags to return (max 50) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "hashtags": [
      { "tag": "healing", "posts_count": 1482, "created_at": "2026-01-14T..." },
      { "tag": "restoration", "posts_count": 987, "created_at": "2026-02-01T..." }
    ]
  }
}
```

> **Note:** This endpoint must be cached in-process (or Redis) with a 5-minute TTL. Do not hit the database on every request.

---

#### `GET /api/v1/hashtags/:tag`

Tag metadata — confirms a tag exists and returns its post count.

**Auth:** Optional

**Response:**
```json
{
  "status": "success",
  "data": {
    "tag": "healing",
    "posts_count": 1482,
    "created_at": "2026-01-14T10:23:00Z"
  }
}
```

**404** if the tag does not exist.

---

#### `GET /api/v1/hashtags/:tag/posts`

Paginated feed of all public posts under a hashtag.

**Auth:** Optional (authenticated users also see their own non-public posts in the results)

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Posts per page (max 100) |

**Response:**
```json
{
  "status": "success",
  "data": {
    "tag": "healing",
    "posts_count": 1482,
    "posts": [
      {
        "id": "...",
        "content": "This journey has been incredible #healing #faith",
        "hashtags": ["faith", "healing"],
        "username": "grace_writes",
        "display_name": "Grace O.",
        "avatar": "...",
        "likes_count": 42,
        "created_at": "2026-06-22T..."
      }
    ],
    "pagination": {
      "page": "1",
      "limit": "20",
      "total": 1482,
      "totalPages": 75
    }
  }
}
```

---

### Modified endpoints

The following existing endpoints gain a `hashtags: string[]` field in their response — no breaking change, purely additive:

- `POST /api/v1/posts` — response includes `hashtags` on the created post
- `GET /api/v1/posts` — each post in the feed includes `hashtags`
- `GET /api/v1/posts/:id` — post detail includes `hashtags`
- `GET /api/v1/posts/me` — each post includes `hashtags`

---

## Validation Rules

Add to the Joi schema in `src/modules/posts/validator.ts`:

```typescript
// Custom validator added to the create/update post schema
content: Joi.string()
  .max(5000)
  .custom((value, helpers) => {
    const regex = /#([a-zA-Z0-9]+)/g;
    const matches = value.match(regex) ?? [];
    const unique = [...new Set(matches.map(m => m.toLowerCase()))];

    if (unique.length > 10) {
      return helpers.error('any.invalid', {
        message: 'Posts may contain a maximum of 10 hashtags'
      });
    }

    return value;
  })
  .optional(),
```

**Rules:**
- Max **10 hashtags** per post
- Hashtag characters: **letters and numbers only** (`[a-zA-Z0-9]`)
- No spaces within a hashtag
- No special characters beyond the leading `#`
- Minimum hashtag length: **1 character** after `#`
- Maximum hashtag length: **50 characters** (enforce in regex or separately)

---

## File Structure

```
src/modules/hashtags/
├── entities.ts          # HashtagEntity, PostHashtagEntity
├── dto.ts               # GetHashtagFeedDto, SearchHashtagDto, TrendingDto
├── interface.ts         # IHashtagsRepository, IHashtagsService
├── query.ts             # All SQL queries for the hashtags module
├── repositories.ts      # HashtagsRepositoryImpl
├── services.ts          # HashtagsServiceImpl (includes trending cache)
├── controller.ts        # Express request handlers
├── routes.ts            # Route definitions + Swagger docs
└── validator.ts         # Joi schemas for hashtag query params
```

Wire into `src/routes/v1/index.ts`:

```typescript
import hashtagsRouter from '../../modules/hashtags/routes';

router.use('/hashtags', hashtagsRouter);
```

---

## Scale Notes

| User threshold | Concern | Mitigation |
|---|---|---|
| Launch | Trending endpoint DB load | 5-min in-process cache on `getTrendingHashtags` |
| ~500k users | Hot-row contention on `posts_count` for viral tags | Move counter increment to a background reconciliation worker (runs every 60s) |
| ~1M users | OFFSET pagination degrades on high-volume tags | Migrate hashtag feed to keyset (cursor) pagination: `WHERE p.created_at < :cursor` |
| ~5M users | Single Postgres read load | Add read replica; route all hashtag feed queries to replica |

The write transaction (upsert + link, max 10 tags) adds at most 20 extra SQL statements per post. At 1,000 posts/minute that is 20,000 extra statements/minute — well within Postgres capacity on any production instance.

---

## Open Questions

These must be decided before Phase 2 (discovery endpoints) ships:

1. **Comments:** Do hashtags in comment content count toward `posts_count` and appear in hashtag feeds? Current spec: posts only.
2. **Soft-delete:** When a post is soft-deleted, should it be immediately removed from hashtag feeds, or after a grace period? Current spec: immediately (filter on `deleted_at IS NULL`).
3. **Visibility:** Should `followers_only` posts appear in hashtag feeds for non-followers? Current spec: public posts only (or own posts when authenticated).
4. **Trending threshold:** Should a tag require a minimum number of posts (e.g. ≥ 3) before appearing in trending? Prevents one-off tags from polluting the trending list.

---

## Implementation Phases

### Phase 1 — Core write path
- Migration: create `hashtags` and `post_hashtags` tables
- `extractHashtags()` in `posts.repository.ts`
- Hashtag upsert + junction insert inside `createPost` transaction
- Hashtag count decrement in `softDeletePost`
- Hashtag re-sync in `updatePost`
- Joi validation rule (max 10, alphanumeric)
- `hashtags[]` field on all post response shapes

### Phase 2 — Discovery endpoints
- Create `src/modules/hashtags/` module
- `GET /hashtags?q=` — typeahead
- `GET /hashtags/trending` — with in-process cache
- `GET /hashtags/:tag` — tag metadata
- `GET /hashtags/:tag/posts` — paginated feed
- Wire into `v1/index.ts`
- Swagger docs for all four endpoints

### Phase 3 — Hardening
- Redis cache on trending (when Redis is available in infra)
- Background worker for `posts_count` reconciliation
- Keyset pagination on hashtag feed
- Integration tests: create with tags → fetch by tag → trending order
