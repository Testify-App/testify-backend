export default {
  isBlockedEitherDirection: `
    SELECT EXISTS(
      SELECT 1 FROM user_blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
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
      ) AS unread_count
    FROM conversation_participants cp
    JOIN conversations c ON c.id = cp.conversation_id
    JOIN conversation_participants other_cp ON other_cp.conversation_id = c.id AND other_cp.user_id != $3
    JOIN users other ON other.id = other_cp.user_id
    LEFT JOIN messages lm ON lm.id = c.last_message_id
    WHERE cp.user_id = $3
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT $2 OFFSET $1;
  `,

  isParticipant: `
    SELECT EXISTS(
      SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2
    );
  `,

  // Messages in a conversation, newest-first, with reply-preview and per-message
  // reaction summary. Unsent messages keep their row (soft delete) but content/
  // media are nulled at read time so unsend is enforced server-side, not just
  // hidden by the client.
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
      m.created_at,
      reply.id            AS reply_to_id,
      reply.content_type  AS reply_to_content_type,
      reply.sender_id     AS reply_to_sender_id,
      reply.is_unsent     AS reply_to_is_unsent,
      CASE WHEN reply.is_unsent THEN NULL ELSE reply.content END AS reply_to_content
    FROM messages m
    LEFT JOIN messages reply ON reply.id = m.reply_to_message_id
    WHERE m.conversation_id = $3
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $1;
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
    INSERT INTO messages (conversation_id, sender_id, reply_to_message_id, content_type, content, media_url)
    VALUES ($1, $2, $3, $4, $5, $6)
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

  addReaction: `
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES ($1, $2, $3)
    ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = NOW()
    RETURNING *;
  `,

  removeReaction: `
    DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 RETURNING *;
  `,

  getOtherParticipant: `
    SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2;
  `,
};
