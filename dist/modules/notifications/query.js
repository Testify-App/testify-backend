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
};
//# sourceMappingURL=query.js.map