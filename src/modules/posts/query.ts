export default {
  createPost: `
    INSERT INTO posts (
      user_id,
      content,
      post_type,
      visibility,
      media_attachments,
      parent_post_id,
      quote_text
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `,

  getPostById: `
    SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL;
  `,

  getPostWithEngagement: `
    SELECT 
      p.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $1 AND p.deleted_at IS NULL;
  `,

  getPostsFeed: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.deleted_at IS NULL
      AND p.parent_post_id IS NULL
      AND (
        (p.visibility = 'public')
        OR (p.user_id = $3)
      )
    ORDER BY p.created_at DESC;
  `,

  getPostsCount: `
    SELECT COUNT(*) as total FROM posts 
    WHERE deleted_at IS NULL
      AND parent_post_id IS NULL
      AND (
        (visibility = 'public')
        OR (user_id = $1)
      );
  `,

  getUserPosts: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = $3
      AND p.deleted_at IS NULL
      AND p.parent_post_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getUserPostsCount: `
    SELECT COUNT(*) as total FROM posts 
    WHERE user_id = $1 
      AND deleted_at IS NULL
      AND parent_post_id IS NULL;
  `,

  updatePost: `
    UPDATE posts 
    SET 
      content = COALESCE($2, content),
      visibility = COALESCE($3, visibility),
      media_attachments = COALESCE($4, media_attachments),
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  softDeletePost: `
    UPDATE posts 
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL;
  `,

  incrementPostCounter: `
    UPDATE posts 
    SET 
      likes_count = likes_count + 1,
      updated_at = NOW()
    WHERE id = $1;
  `,

  decrementPostCounter: `
    UPDATE posts 
    SET 
      likes_count = GREATEST(likes_count - 1, 0),
      updated_at = NOW()
    WHERE id = $1;
  `,

  incrementPostCommentsCounter: `
    UPDATE posts 
    SET 
      comments_count = comments_count + 1,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `,

  createComment: `
    INSERT INTO comments (
      post_id,
      user_id,
      parent_comment_id,
      content,
      media_attachments
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `,

  getCommentById: `
    SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL;
  `,

  getPostComments: `
    SELECT COUNT(*) OVER () as count,
      c.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $3
      AND c.deleted_at IS NULL
      AND c.parent_comment_id IS NULL
    ORDER BY c.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getPostCommentsCount: `
    SELECT COUNT(*) as total FROM comments 
    WHERE post_id = $1 
      AND deleted_at IS NULL
      AND parent_comment_id IS NULL;
  `,

  updateComment: `
    UPDATE comments 
    SET 
      content = COALESCE($2, content),
      media_attachments = COALESCE($3, media_attachments),
      updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  softDeleteComment: `
    UPDATE comments 
    SET deleted_at = NOW(), deleted_by = $2, updated_at = NOW()
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,

  likePost: `
    INSERT INTO post_likes (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  `,

  unlikePost: `
    DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2;
  `,

  isPostLiked: `
    SELECT EXISTS(SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2);
  `,

  getPostLikes: `
    SELECT COUNT(*) OVER () as count,
      pl.*, u.username, u.avatar
    FROM post_likes pl
    JOIN users u ON pl.user_id = u.id
    WHERE pl.post_id = $3
    ORDER BY pl.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getPostLikesCount: `
    SELECT COUNT(*) as total FROM post_likes WHERE post_id = $1;
  `,

  likeComment: `
    INSERT INTO comment_likes (comment_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (comment_id, user_id) DO NOTHING
    RETURNING *;
  `,

  unlikeComment: `
    DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2;
  `,

  isCommentLiked: `
    SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2);
  `,

  repost: `
    INSERT INTO reposts (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  `,

  unrepost: `
    DELETE FROM reposts WHERE post_id = $1 AND user_id = $2;
  `,

  isReposted: `
    SELECT EXISTS(SELECT 1 FROM reposts WHERE post_id = $1 AND user_id = $2);
  `,

  getPostReposts: `
    SELECT COUNT(*) OVER () as count,
      r.*, u.username, u.avatar
    FROM reposts r
    JOIN users u ON r.user_id = u.id
    WHERE r.post_id = $3
    ORDER BY r.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getPostRepostsCount: `
    SELECT COUNT(*) as total FROM reposts WHERE post_id = $1;
  `,

  createPostMention: `
    INSERT INTO post_mentions (post_id, mentioned_user_id, mention_type)
    VALUES ($1, $2, $3)
    ON CONFLICT (post_id, mentioned_user_id) DO NOTHING
    RETURNING *;
  `,

  bookmarkPost: `
    INSERT INTO post_bookmarks (post_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, user_id) DO NOTHING
    RETURNING *;
  `,

  unbookmarkPost: `
    DELETE FROM post_bookmarks WHERE post_id = $1 AND user_id = $2;
  `,

  isBookmarked: `
    SELECT EXISTS(SELECT 1 FROM post_bookmarks WHERE post_id = $1 AND user_id = $2);
  `,

  getUserBookmarks: `
    SELECT COUNT(*) OVER () as count,
      p.*,
      u.id as user_id,
      u.username,
      u.avatar
    FROM post_bookmarks pb
    JOIN posts p ON pb.post_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE pb.user_id = $3 AND p.deleted_at IS NULL
    ORDER BY pb.created_at DESC
    LIMIT $1 OFFSET $2;
  `,

  getUserBookmarksCount: `
    SELECT COUNT(*) as total FROM post_bookmarks 
    WHERE user_id = $1;
  `,

  getQuotePosts: `
    SELECT 
      p.*,
      u.id as user_id,
      u.username,
      u.avatar,
      original.content as original_content,
      original_user.username as original_author
    FROM posts p
    JOIN posts original ON p.parent_post_id = original.id
    JOIN users u ON p.user_id = u.id
    JOIN users original_user ON original.user_id = original_user.id
    WHERE p.parent_post_id = $1 
      AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3;
  `,

  isPostOwner: `
    SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL);
  `,

  isCommentOnPost: `
    SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1 AND post_id = $2);
  `,
};
