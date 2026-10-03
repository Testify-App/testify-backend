"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    createNotification: `
    INSERT INTO notifications (user_id, actor_id, type, entity_type, entity_id, data)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `,
    getNotifications: `
    SELECT COUNT(*) OVER () as count,
      n.*,
      actor.id         AS actor_id,
      actor.username   AS actor_username,
      actor.avatar     AS actor_avatar
    FROM notifications n
    LEFT JOIN users actor ON n.actor_id = actor.id
    WHERE n.user_id = $3
      AND ($4::text IS NULL OR n.type = ANY(string_to_array($4, ',')))
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $1;
  `,
    getUnreadCount: `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = $1 AND is_read = FALSE;
  `,
    markAsRead: `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `,
    markAllAsRead: `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = $1 AND is_read = FALSE;
  `,
    deleteNotification: `
    DELETE FROM notifications
    WHERE id = $1 AND user_id = $2;
  `,
    getNotificationById: `
    SELECT * FROM notifications WHERE id = $1 AND user_id = $2;
  `,
    getNotificationPreferences: `
    SELECT likes, comments_replies, mentions, new_followers, reposts, circle_activity
    FROM notification_preferences
    WHERE user_id = $1;
  `,
    upsertNotificationPreferences: `
    INSERT INTO notification_preferences (user_id, likes, comments_replies, mentions, new_followers, reposts, circle_activity)
    VALUES ($1, COALESCE($2, TRUE), COALESCE($3, TRUE), COALESCE($4, TRUE), COALESCE($5, TRUE), COALESCE($6, TRUE), COALESCE($7, TRUE))
    ON CONFLICT (user_id) DO UPDATE SET
      likes            = COALESCE($2, notification_preferences.likes),
      comments_replies = COALESCE($3, notification_preferences.comments_replies),
      mentions         = COALESCE($4, notification_preferences.mentions),
      new_followers    = COALESCE($5, notification_preferences.new_followers),
      reposts          = COALESCE($6, notification_preferences.reposts),
      circle_activity  = COALESCE($7, notification_preferences.circle_activity),
      updated_at       = NOW()
    RETURNING likes, comments_replies, mentions, new_followers, reposts, circle_activity;
  `,
};
//# sourceMappingURL=query.js.map