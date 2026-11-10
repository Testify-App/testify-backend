import { Queryable } from './db';
import { BadException, NotFoundException } from './errors';

export type ModeratedContentType = 'post' | 'comment';

export interface ContentSnapshot {
  id: string;
  type: ModeratedContentType;
  ownerId: string;
  preview: string;
}

const preview = (content: string | null | undefined) => {
  const text = `${content ?? ''}`.replace(/\s+/g, ' ').trim();
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
};

/**
 * Hides a post or comment for moderation. Mirrors the author's own delete (sets deleted_at,
 * which every feed and detail query already filters on, and adjusts the same counters) but
 * keeps `status` and records who hid it, so restoreContent can put everything back.
 */
export const hideContent = async (
  t: Queryable,
  input: { type: ModeratedContentType; id: string; adminId: string; reason: string | null; reportId?: string | null },
): Promise<ContentSnapshot> => {
  if (input.type === 'post') {
    const post = await t.oneOrNone(
      'SELECT id, user_id, content, deleted_at, hidden_at FROM posts WHERE id = $1 FOR UPDATE;',
      [input.id],
    );
    if (!post) throw new NotFoundException('Post not found.');
    if (post.hidden_at) throw new BadException('This post is already hidden.');
    if (post.deleted_at) throw new BadException('This post was deleted by its author.');
    await t.none(
      `UPDATE posts SET hidden_at = NOW(), hidden_by_admin_id = $2, hidden_reason = $3,
         hidden_report_id = $4, deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1;`,
      [input.id, input.adminId, input.reason, input.reportId ?? null],
    );
    await t.none(
      `UPDATE hashtags SET posts_count = GREATEST(posts_count - 1, 0)
       WHERE id IN (SELECT hashtag_id FROM post_hashtags WHERE post_id = $1);`,
      [input.id],
    );
    return { id: post.id, type: 'post', ownerId: post.user_id, preview: preview(post.content) };
  }
  const comment = await t.oneOrNone(
    'SELECT id, user_id, post_id, parent_comment_id, content, deleted_at, hidden_at FROM comments WHERE id = $1 FOR UPDATE;',
    [input.id],
  );
  if (!comment) throw new NotFoundException('Comment not found.');
  if (comment.hidden_at) throw new BadException('This comment is already hidden.');
  if (comment.deleted_at) throw new BadException('This comment was deleted by its author.');
  await t.none(
    `UPDATE comments SET hidden_at = NOW(), hidden_by_admin_id = $2, hidden_reason = $3,
       hidden_report_id = $4, deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1;`,
    [input.id, input.adminId, input.reason, input.reportId ?? null],
  );
  await t.none('UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1;', [comment.post_id]);
  if (comment.parent_comment_id) {
    await t.none('UPDATE comments SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = $1;', [comment.parent_comment_id]);
  }
  return { id: comment.id, type: 'comment', ownerId: comment.user_id, preview: preview(comment.content) };
};

/** Reverses hideContent. Only works on content hidden by moderation, never on author deletes. */
export const restoreContent = async (
  t: Queryable,
  input: { type: ModeratedContentType; id: string },
): Promise<ContentSnapshot & { hiddenReason: string | null }> => {
  if (input.type === 'post') {
    const post = await t.oneOrNone(
      'SELECT id, user_id, content, hidden_at, hidden_reason FROM posts WHERE id = $1 FOR UPDATE;',
      [input.id],
    );
    if (!post || !post.hidden_at) throw new NotFoundException('Hidden post not found.');
    await t.none(
      `UPDATE posts SET hidden_at = NULL, hidden_by_admin_id = NULL, hidden_reason = NULL,
         hidden_report_id = NULL, deleted_at = NULL, updated_at = NOW()
       WHERE id = $1;`,
      [input.id],
    );
    await t.none(
      `UPDATE hashtags SET posts_count = posts_count + 1
       WHERE id IN (SELECT hashtag_id FROM post_hashtags WHERE post_id = $1);`,
      [input.id],
    );
    return { id: post.id, type: 'post', ownerId: post.user_id, preview: preview(post.content), hiddenReason: post.hidden_reason };
  }
  const comment = await t.oneOrNone(
    'SELECT id, user_id, post_id, parent_comment_id, content, hidden_at, hidden_reason FROM comments WHERE id = $1 FOR UPDATE;',
    [input.id],
  );
  if (!comment || !comment.hidden_at) throw new NotFoundException('Hidden comment not found.');
  await t.none(
    `UPDATE comments SET hidden_at = NULL, hidden_by_admin_id = NULL, hidden_reason = NULL,
       hidden_report_id = NULL, deleted_at = NULL, updated_at = NOW()
     WHERE id = $1;`,
    [input.id],
  );
  await t.none('UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1;', [comment.post_id]);
  if (comment.parent_comment_id) {
    await t.none('UPDATE comments SET replies_count = replies_count + 1 WHERE id = $1;', [comment.parent_comment_id]);
  }
  return {
    id: comment.id, type: 'comment', ownerId: comment.user_id, preview: preview(comment.content), hiddenReason: comment.hidden_reason,
  };
};
