export default {
  isBlockedEitherDirection: `
    SELECT EXISTS(
      SELECT 1 FROM user_blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
    );
  `,

  getMessagingPrivacySetting: `
    SELECT who_can_message FROM messaging_privacy_settings WHERE user_id = $1;
  `,

  // Deleted (deleted_at set) or deactivated (status = 'deactivated') both read
  // as unavailable here — neither can be messaged, regardless of their
  // messaging-privacy setting, since there's no live account to apply it to.
  isAccountAvailable: `
    SELECT (deleted_at IS NULL AND status != 'deactivated') AS available
    FROM users WHERE id = $1;
  `,

  upsertMessagingPrivacySetting: `
    INSERT INTO messaging_privacy_settings (user_id, who_can_message, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET who_can_message = EXCLUDED.who_can_message, updated_at = NOW()
    RETURNING *;
  `,

  getStoryReplySetting: `
    SELECT who_can_reply FROM story_reply_settings WHERE user_id = $1;
  `,

  upsertStoryReplySetting: `
    INSERT INTO story_reply_settings (user_id, who_can_reply, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id) DO UPDATE SET who_can_reply = EXCLUDED.who_can_reply, updated_at = NOW()
    RETURNING *;
  `,

  // $1 = story author, $2 = would-be replier. Checks whether the AUTHOR added
  // the replier to their own Circle — the gate is the author's relationship
  // list, same direction convention as isFollowedByUser's "following" tier
  // (the recipient's own list decides, not the sender's).
  isInAuthorsCircle: `
    SELECT EXISTS(
      SELECT 1 FROM user_connections WHERE user_id = $1 AND connected_user_id = $2 AND status = 'accepted'
    );
  `,

  // Live, non-expired story plus its author id and per-story allow_replies
  // override — everything sendMessage needs to resolve reply permission and
  // build the quote snapshot in one query.
  getStoryForReply: `
    SELECT s.id, s.user_id AS author_id, s.content_type, s.media_url, s.thumbnail_url,
      s.text_content, s.background_style, s.allow_replies, s.created_at,
      u.username AS author_username, u.display_name AS author_display_name
    FROM stories s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = $1 AND s.deleted_at IS NULL AND s.expires_at > NOW();
  `,

  // $1 = recipient (whose setting gates access), $2 = sender (the one trying
  // to message them). "following" means the RECIPIENT already follows the
  // sender — matches the product rule that Circle members (drawn from people
  // the owner follows) automatically satisfy this tier.
  isFollowedByUser: `
    SELECT EXISTS(
      SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2
    );
  `,

  // Finds an existing 1:1 conversation between exactly these two users, if one
  // exists. Two separate EXISTS checks (not a single join) because a
  // conversation_participants row doesn't distinguish "the other participant" —
  // both directions need confirming independently.
  findDirectConversation: `
    SELECT c.id
    FROM conversations c
    WHERE c.type = 'direct'
      AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $1)
      AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = c.id AND user_id = $2)
      AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2;
  `,

  createConversation: `
    INSERT INTO conversations (type) VALUES ('direct') RETURNING id;
  `,

  addParticipant: `
    INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2);
  `,

  // Inbox listing: one row per conversation the user is in, with the other
  // participant's profile, the last message preview, and an unread count
  // (messages after this user's last_read_message_id, excluding their own sends).
  // $4 is an optional search term (ILIKE on the other participant's username/
  // display_name) — pass null to skip filtering entirely.
  // A conversation the caller deleted is hidden unless a message has arrived
  // since (c.last_message_at > cp.deleted_at) — that's what makes it
  // "reappear" on a new message without restoring anything for the deleter.
  // can_send_message reflects whether the OTHER participant's current
  // messaging-privacy setting (and block status) still lets the caller send
  // a NEW message into this conversation — existing history stays visible
  // regardless, this only gates sending. Computed here so the frontend can
  // disable the composer without a second round trip per conversation.
  // is_account_available is false once the other participant is deleted
  // (deleted_at set) OR deactivated (status = 'deactivated') — either state
  // forces can_send_message to false regardless of their privacy setting,
  // since there's no live account to apply that setting to. A plain INNER
  // JOIN on users (not filtered by deleted_at) is deliberate: a deleted
  // user's row must still resolve so the conversation can report their
  // unavailable state, rather than disappearing or erroring.
  getConversations: `
    SELECT COUNT(*) OVER () as count,
      c.id,
      c.type,
      c.last_message_at,
      c.created_at,
      other.id            AS other_user_id,
      other.username      AS other_username,
      other.display_name  AS other_display_name,
      other.avatar        AS other_avatar,
      (other.deleted_at IS NOT NULL OR other.status = 'deactivated') AS other_account_unavailable,
      (other.deleted_at IS NOT NULL) AS other_account_deleted,
      lm.id               AS last_message_id,
      lm.content          AS last_message_content,
      lm.content_type     AS last_message_content_type,
      lm.is_unsent        AS last_message_is_unsent,
      lm.sender_id        AS last_message_sender_id,
      lm.created_at       AS last_message_created_at,
      (
        SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = c.id
          AND m.sender_id != $3
          AND (
            cp.last_read_message_id IS NULL
            OR m.created_at > (SELECT created_at FROM messages WHERE id = cp.last_read_message_id)
          )
          AND (cp.deleted_at IS NULL OR m.created_at > cp.deleted_at)
      ) AS unread_count,
      (other.deleted_at IS NULL AND other.status != 'deactivated')
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks
        WHERE (blocker_id = $3 AND blocked_id = other.id)
           OR (blocker_id = other.id AND blocked_id = $3)
      )
      AND (
        COALESCE(mps.who_can_message, 'everyone') = 'everyone'
        OR (
          COALESCE(mps.who_can_message, 'everyone') = 'following'
          AND EXISTS (SELECT 1 FROM user_follows WHERE follower_id = other.id AND following_id = $3)
        )
      ) AS can_send_message
    FROM conversation_participants cp
    JOIN conversations c ON c.id = cp.conversation_id
    JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id AND other_cp.user_id != $3
    JOIN users other ON other.id = other_cp.user_id
    LEFT JOIN messages lm ON lm.id = c.last_message_id
    LEFT JOIN messaging_privacy_settings mps ON mps.user_id = other.id
    WHERE cp.user_id = $3
      AND (cp.deleted_at IS NULL OR c.last_message_at > cp.deleted_at)
      AND ($4::text IS NULL OR other.username ILIKE '%' || $4 || '%' OR other.display_name ILIKE '%' || $4 || '%')
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  // Sum of unread_count across every conversation the user is in — used for
  // a single lightweight badge count rather than fetching the whole inbox.
  getTotalUnreadCount: `
    SELECT COALESCE(SUM(unread), 0) AS total_unread
    FROM (
      SELECT (
        SELECT COUNT(*) FROM messages m
        WHERE m.conversation_id = cp.conversation_id
          AND m.sender_id != $1
          AND (
            cp.last_read_message_id IS NULL
            OR m.created_at > (SELECT created_at FROM messages WHERE id = cp.last_read_message_id)
          )
          AND (cp.deleted_at IS NULL OR m.created_at > cp.deleted_at)
      ) AS unread
      FROM conversation_participants cp
      WHERE cp.user_id = $1
        AND (cp.deleted_at IS NULL OR EXISTS (
          SELECT 1 FROM conversations c2 WHERE c2.id = cp.conversation_id AND c2.last_message_at > cp.deleted_at
        ))
    ) counts;
  `,

  isParticipant: `
    SELECT EXISTS(
      SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2
    );
  `,

  // Messages in a conversation, newest-first, with reply-preview and per-message
  // reaction summary. Unsent messages keep their row (soft delete) but content/
  // media are nulled at read time so unsend is enforced server-side, not just
  // hidden by the client. $4 is the caller's own deleted_at floor (or null) —
  // messages at or before it stay invisible to them permanently, even after
  // the conversation reappears from a later message. $5 is the caller's
  // user_id — anti-joined against message_deletions so a message they
  // individually deleted never reappears for them (but stays untouched for
  // the other participant, since the deletion row is per-user).
  getMessages: `
    SELECT COUNT(*) OVER () as count,
      m.id,
      m.conversation_id,
      m.sender_id,
      m.reply_to_message_id,
      m.content_type,
      CASE WHEN m.is_unsent THEN NULL ELSE m.content END AS content,
      CASE WHEN m.is_unsent THEN NULL ELSE m.media_url END AS media_url,
      m.is_unsent,
      m.edited_at,
      m.created_at,
      m.quoted_story_id,
      m.quoted_story_snapshot,
      reply.id            AS reply_to_id,
      reply.content_type  AS reply_to_content_type,
      reply.sender_id     AS reply_to_sender_id,
      reply.is_unsent     AS reply_to_is_unsent,
      CASE WHEN reply.is_unsent THEN NULL ELSE reply.content END AS reply_to_content
    FROM messages m
    LEFT JOIN messages reply ON reply.id = m.reply_to_message_id
    WHERE m.conversation_id = $3
      AND ($4::timestamptz IS NULL OR m.created_at > $4)
      AND NOT EXISTS (SELECT 1 FROM message_deletions md WHERE md.message_id = m.id AND md.user_id = $5)
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  deleteMessageForUser: `
    INSERT INTO message_deletions (message_id, user_id) VALUES ($1, $2)
    ON CONFLICT (message_id, user_id) DO NOTHING
    RETURNING *;
  `,

  getParticipant: `
    SELECT conversation_id, user_id, last_read_message_id, last_read_at, joined_at, deleted_at
    FROM conversation_participants
    WHERE conversation_id = $1 AND user_id = $2;
  `,

  deleteConversationForUser: `
    UPDATE conversation_participants
    SET deleted_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2
    RETURNING *;
  `,

  // The other participant's read marker for this conversation — returned
  // alongside the message list so the client can render "seen up to here"
  // without a second round trip.
  getOtherParticipantLastRead: `
    SELECT last_read_message_id FROM conversation_participants
    WHERE conversation_id = $1 AND user_id != $2;
  `,

  getReactionsForMessages: `
    SELECT message_id, emoji, COUNT(*) as count,
      BOOL_OR(user_id = $2) as reacted_by_viewer
    FROM message_reactions
    WHERE message_id = ANY($1::text[])
    GROUP BY message_id, emoji;
  `,

  getMessageById: `
    SELECT id, conversation_id, sender_id, is_unsent FROM messages WHERE id = $1;
  `,

  createMessage: `
    INSERT INTO messages (conversation_id, sender_id, reply_to_message_id, content_type, content, media_url, quoted_story_id, quoted_story_snapshot)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `,

  updateConversationLastMessage: `
    UPDATE conversations SET last_message_id = $2, last_message_at = NOW() WHERE id = $1;
  `,

  markConversationRead: `
    UPDATE conversation_participants
    SET last_read_message_id = $3, last_read_at = NOW()
    WHERE conversation_id = $1 AND user_id = $2
    RETURNING *;
  `,

  unsendMessage: `
    UPDATE messages SET is_unsent = TRUE
    WHERE id = $1 AND sender_id = $2 AND is_unsent = FALSE
    RETURNING *;
  `,

  // Editing is restricted to text messages — media (image/video/audio) has
  // no meaningful "edit", only re-send. Blocked once a message is unsent so
  // editing can't resurrect content the sender already retracted.
  editMessage: `
    UPDATE messages
    SET content = $3, edited_at = NOW()
    WHERE id = $1 AND sender_id = $2 AND is_unsent = FALSE AND content_type = 'text'
    RETURNING *;
  `,

  addReaction: `
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES ($1, $2, $3)
    ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = NOW()
    RETURNING *;
  `,

  removeReaction: `
    DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 RETURNING *;
  `,

  // Who reacted to a message and with what — ordered newest-first so the
  // most recent reaction shows first in a "reacted by" list.
  getReactors: `
    SELECT COUNT(*) OVER () as count,
      mr.user_id,
      mr.emoji,
      mr.created_at,
      u.username,
      u.display_name,
      u.avatar,
      (mr.user_id = $3) AS is_viewer
    FROM message_reactions mr
    JOIN users u ON u.id = mr.user_id
    WHERE mr.message_id = $4
    ORDER BY mr.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  getOtherParticipant: `
    SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2;
  `,

  getParticipantIds: `
    SELECT user_id FROM conversation_participants WHERE conversation_id = $1;
  `,

  // Every other participant this user has a direct conversation with — used
  // to notify conversation partners in real time when this user's messaging
  // privacy setting changes, so an open chat's composer can update without
  // the other side needing to refresh or re-fetch the inbox.
  getConversationPartnerIds: `
    SELECT DISTINCT other_cp.user_id, cp.conversation_id
    FROM conversation_participants cp
    JOIN conversation_participants other_cp ON other_cp.conversation_id = cp.conversation_id AND other_cp.user_id != cp.user_id
    WHERE cp.user_id = $1;
  `,
};
