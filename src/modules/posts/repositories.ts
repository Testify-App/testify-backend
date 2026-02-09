import * as dtos from './dto';
import * as entities from './entities';
import PostsQuery from './query';
import { db } from '../../config/database';
import { PostsInterface } from './interface';
import {
  BadException,
  NotFoundException,
  InternalServerErrorException,
} from '../../shared/lib/errors';
import {
  fetchResourceByPage,
  calcPages,
  FetchPaginatedResponse,
} from '../../shared/helpers';

export class PostsRepositoryImpl implements PostsInterface {
  public async createPost(
    payload: dtos.CreatePostDTO
  ): Promise<BadException | entities.PostEntity> {
    try {
      const response = await db.tx(async (t) => {
        // Determine post type based on media attachments
        let postType = 'text';
        if (payload.media_attachments && payload.media_attachments.length > 0) {
          const types = new Set(payload.media_attachments.map(m => m.type));
          if (types.size === 1) {
            postType = types.values().next().value;
          } else {
            postType = 'mixed';
          }
        }

        // If it's a quote post, validate parent post exists
        if (payload.parent_post_id) {
          const parentPost = await t.oneOrNone(PostsQuery.getPostById, [payload.parent_post_id]);
          if (!parentPost) {
            throw new BadException('Parent post not found');
          }
        }

        const post = await t.one(PostsQuery.createPost, [
          payload.user_id,
          payload.content || null,
          postType,
          payload.visibility || 'public',
          JSON.stringify(payload.media_attachments || []),
          payload.parent_post_id || null,
          payload.quote_text || null,
        ]);

        // If it's a quote post, increment quotes_count on parent
        if (payload.parent_post_id) {
          await t.none('UPDATE posts SET quotes_count = quotes_count + 1 WHERE id = $1', [payload.parent_post_id]);
        }

        // Extract and create mentions
        if (payload.content) {
          const mentions = this.extractMentions(payload.content);
          for (const mentionedUserId of mentions) {
            await t.none(PostsQuery.createPostMention, [post.id, mentionedUserId, 'content']);
          }
        }

        return new entities.PostEntity(post);
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async getPosts(
    payload: dtos.GetPostsQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id } = payload as { page?: string; limit?: string; user_id: string };
      const [{ count }, posts] = await fetchResourceByPage({
        page,
        limit,
        getResources: PostsQuery.getPostsFeed,
        params: [user_id],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        posts: posts,
      };
    } catch (error) {
      return new InternalServerErrorException(`${error.message}`);
    }
  };

  public async getPost(
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | entities.PostWithUserEntity> {
    try {
      const post = await db.oneOrNone(PostsQuery.getPostWithEngagement, [payload.post_id]);
      if (!post) {
        return new NotFoundException('Post not found');
      }

      return new entities.PostWithUserEntity(post);
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async updatePost(
    payload: dtos.UpdatePostDTO
  ): Promise<BadException | entities.PostEntity> {
    try {
      const response = await db.tx(async (t) => {
        const isOwner = await t.one(PostsQuery.isPostOwner, [
          payload.post_id, payload.user_id
        ]);
        if (!isOwner.exists) {
          throw new BadException('Post not found or you do not have permission to update it');
        }
        const post = await t.one(PostsQuery.updatePost, [
          payload.post_id,
          payload.content || null,
          payload.visibility || null,
          payload.media_attachments ? JSON.stringify(payload.media_attachments) : null,
        ]);

        return new entities.PostEntity(post);
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async deletePost(
    payload: dtos.DeletePostDTO
  ): Promise<NotFoundException | { message: string }> {
    try {
      const response = await db.tx(async (t) => {
        const isOwner = await t.one(PostsQuery.isPostOwner, [payload.post_id, payload.user_id]);
        if (!isOwner.exists) {
          throw new NotFoundException('Post not found or you do not have permission to delete it');
        }

        await t.none(PostsQuery.softDeletePost, [payload.post_id, payload.user_id]);
        return { message: 'Post deleted successfully' };
      });
      return response;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async likePost(
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string; is_liked: boolean }> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [payload.post_id]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const existingLike = await t.oneOrNone(
          'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
          [payload.post_id, payload.user_id]
        );

        if (existingLike) {
          return { message: 'Post already liked', is_liked: true };
        }

        await t.none(PostsQuery.likePost, [payload.post_id, payload.user_id]);
        await t.none(PostsQuery.incrementPostCounter, [payload.post_id]);

        return { message: 'Post liked successfully', is_liked: true };
      });
      return response;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async unlikePost(
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string }> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [payload.post_id]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const existingLike = await t.oneOrNone(
          'SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2',
          [payload.post_id, payload.user_id]
        );

        if (!existingLike) {
          return { message: 'Post not liked yet' };
        }

        await t.none(PostsQuery.unlikePost, [payload.post_id, payload.user_id]);
        await t.none(PostsQuery.decrementPostCounter, [payload.post_id]);

        return { message: 'Post unliked successfully' };
      });
      return response;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async repost(
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string; is_reposted: boolean }> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [payload.post_id]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const existingRepost = await t.oneOrNone(
          'SELECT id FROM reposts WHERE post_id = $1 AND user_id = $2',
          [payload.post_id, payload.user_id]
        );

        if (existingRepost) {
          return { message: 'Post already reposted', is_reposted: true };
        }

        await t.none(PostsQuery.repost, [payload.post_id, payload.user_id]);
        await t.none('UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = $1', [payload.post_id]);

        return { message: 'Post reposted successfully', is_reposted: true };
      });
      return response;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async unrepost(
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string }> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [payload.post_id]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const existingRepost = await t.oneOrNone(
          'SELECT id FROM reposts WHERE post_id = $1 AND user_id = $2',
          [payload.post_id, payload.user_id]
        );

        if (!existingRepost) {
          return { message: 'Post not reposted yet' };
        }

        await t.none(PostsQuery.unrepost, [payload.post_id, payload.user_id]);
        await t.none('UPDATE posts SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = $1', [payload.post_id]);

        return { message: 'Repost removed successfully' };
      });
      return response;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async quoteRepost(
    payload: dtos.CreatePostDTO
  ): Promise<BadException | entities.PostEntity> {
    if (!payload.parent_post_id) {
      return new BadException('Parent post ID is required for quote repost');
    }
    return await this.createPost(payload);
  }

  public async bookmarkPost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string; is_bookmarked: boolean }> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [postId]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const existingBookmark = await t.oneOrNone(
          'SELECT id FROM post_bookmarks WHERE post_id = $1 AND user_id = $2',
          [postId, userId]
        );

        if (existingBookmark) {
          return { message: 'Post already bookmarked', is_bookmarked: true };
        }

        await t.none(PostsQuery.bookmarkPost, [postId, userId]);

        return { message: 'Post bookmarked successfully', is_bookmarked: true };
      });
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async unbookmarkPost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [postId]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        const existingBookmark = await t.oneOrNone(
          'SELECT id FROM post_bookmarks WHERE post_id = $1 AND user_id = $2',
          [postId, userId]
        );

        if (!existingBookmark) {
          return { message: 'Post not bookmarked yet' };
        }

        await t.none(PostsQuery.unbookmarkPost, [postId, userId]);

        return { message: 'Bookmark removed successfully' };
      });
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async getPostLikes(
    postId: string,
    query: dtos.GetLikesQueryDTO
  ): Promise<BadException | NotFoundException | { likes: entities.PostLikeEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> {
    try {
      const post = await db.oneOrNone(PostsQuery.getPostById, [postId]);
      if (!post) {
        return new NotFoundException('Post not found');
      }

      const { page = '1', limit = '20' } = query as { page?: string; limit?: string };
      const [{ count }, likes] = await fetchResourceByPage({
        page,
        limit,
        getResources: PostsQuery.getPostLikes,
        params: [postId],
      });

      return {
        likes: likes.map((l: any) => new entities.PostLikeEntity(l)),
        pagination: { page: String(page), limit: String(limit), total: count, totalPages: calcPages(count, limit) },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async getPostReposts(
    postId: string,
    query: dtos.GetRepostsQueryDTO
  ): Promise<BadException | NotFoundException | { reposts: entities.RepostEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> {
    try {
      const post = await db.oneOrNone(PostsQuery.getPostById, [postId]);
      if (!post) {
        return new NotFoundException('Post not found');
      }

      const { page = '1', limit = '20' } = query as { page?: string; limit?: string };
      const [{ count }, reposts] = await fetchResourceByPage({
        page,
        limit,
        getResources: PostsQuery.getPostReposts,
        params: [postId],
      });

      return {
        reposts: reposts.map((r: any) => new entities.RepostEntity(r)),
        pagination: { page: String(page), limit: String(limit), total: count, totalPages: calcPages(count, limit) },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async createComment(
    userId: string,
    postId: string,
    payload: dtos.CreateCommentDTO
  ): Promise<BadException | NotFoundException | entities.CommentEntity> {
    try {
      const response = await db.tx(async (t) => {
        const post = await t.oneOrNone(PostsQuery.getPostById, [postId]);
        if (!post) {
          throw new NotFoundException('Post not found');
        }

        // Validate parent comment if provided
        if (payload.parent_comment_id) {
          const parentComment = await t.oneOrNone(PostsQuery.getCommentById, [payload.parent_comment_id]);
          if (!parentComment) {
            throw new NotFoundException('Parent comment not found');
          }
        }

        const comment = await t.one(PostsQuery.createComment, [
          postId,
          userId,
          payload.parent_comment_id || null,
          payload.content,
          JSON.stringify(payload.media_attachments || []),
        ]);

        await t.none(PostsQuery.incrementPostCommentsCounter, [postId]);

        return new entities.CommentEntity(comment);
      });
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async getComments(
    userId: string,
    postId: string,
    query: dtos.GetCommentsQueryDTO
  ): Promise<BadException | NotFoundException | { comments: entities.CommentWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> {
    try {
      const post = await db.oneOrNone(PostsQuery.getPostById, [postId]);
      if (!post) {
        return new NotFoundException('Post not found');
      }

      const { page = '1', limit = '20' } = query as { page?: string; limit?: string };
      const [{ count }, comments] = await fetchResourceByPage({
        page,
        limit,
        getResources: PostsQuery.getPostComments,
        params: [postId],
      });

      const commentsWithEngagement = await Promise.all(
        comments.map(async (comment: any) => {
          const isLiked = await db.one(PostsQuery.isCommentLiked, [comment.id, userId]);

          return new entities.CommentWithUserEntity({
            ...comment,
            is_liked: isLiked.exists,
            user: {
              id: comment.user_id,
              username: comment.username,
              avatar: comment.avatar,
            },
          });
        })
      );

      return {
        comments: commentsWithEngagement,
        pagination: { page: String(page), limit: String(limit), total: count, totalPages: calcPages(count, limit) },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async likeComment(
    userId: string,
    commentId: string
  ): Promise<BadException | NotFoundException | { message: string; is_liked: boolean }> {
    try {
      const response = await db.tx(async (t) => {
        const comment = await t.oneOrNone(PostsQuery.getCommentById, [commentId]);
        if (!comment) {
          throw new NotFoundException('Comment not found');
        }

        const existingLike = await t.oneOrNone(
          'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
          [commentId, userId]
        );

        if (existingLike) {
          return { message: 'Comment already liked', is_liked: true };
        }

        await t.none(PostsQuery.likeComment, [commentId, userId]);
        await t.none('UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1', [commentId]);

        return { message: 'Comment liked successfully', is_liked: true };
      });
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async unlikeComment(
    userId: string,
    commentId: string
  ): Promise<BadException | NotFoundException | { message: string }> {
    try {
      const response = await db.tx(async (t) => {
        const comment = await t.oneOrNone(PostsQuery.getCommentById, [commentId]);
        if (!comment) {
          throw new NotFoundException('Comment not found');
        }

        const existingLike = await t.oneOrNone(
          'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
          [commentId, userId]
        );

        if (!existingLike) {
          return { message: 'Comment not liked yet' };
        }

        await t.none(PostsQuery.unlikeComment, [commentId, userId]);
        await t.none('UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1', [commentId]);

        return { message: 'Comment unliked successfully' };
      });
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  }

  public async getUserPosts(
    userId: string,
    targetUserId: string,
    query: dtos.GetPostsQueryDTO
  ): Promise<BadException | { posts: entities.PostWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> {
    try {
      const { page = '1', limit = '20' } = query as { page?: string; limit?: string };
      const [{ count }, posts] = await fetchResourceByPage({
        page,
        limit,
        getResources: PostsQuery.getUserPosts,
        params: [targetUserId],
      });

      const postsWithEngagement = await Promise.all(
        posts.map(async (post: any) => {
          const isLiked = await db.one(PostsQuery.isPostLiked, [post.id, userId]);
          const isReposted = await db.one(PostsQuery.isReposted, [post.id, userId]);
          const isBookmarked = await db.one(PostsQuery.isBookmarked, [post.id, userId]);

          return new entities.PostWithUserEntity({
            ...post,
            is_liked: isLiked.exists,
            is_reposted: isReposted.exists,
            is_bookmarked: isBookmarked.exists,
            user: {
              id: post.user_id,
              username: post.username,
              avatar: post.avatar,
            },
          });
        })
      );

      return {
        posts: postsWithEngagement,
        pagination: { page: String(page), limit: String(limit), total: count, totalPages: calcPages(count, limit) },
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getUserBookmarks(
    userId: string,
    query: dtos.GetPostsQueryDTO
  ): Promise<BadException | { posts: entities.PostWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> {
    try {
      const { page = '1', limit = '20' } = query as { page?: string; limit?: string };
      const [{ count }, posts] = await fetchResourceByPage({
        page,
        limit,
        getResources: PostsQuery.getUserBookmarks,
        params: [userId],
      });

      const postsWithEngagement = await Promise.all(
        posts.map(async (post: any) => {
          const isLiked = await db.one(PostsQuery.isPostLiked, [post.id, userId]);
          const isReposted = await db.one(PostsQuery.isReposted, [post.id, userId]);
          const isBookmarked = await db.one(PostsQuery.isBookmarked, [post.id, userId]);

          return new entities.PostWithUserEntity({
            ...post,
            is_liked: isLiked.exists,
            is_reposted: isReposted.exists,
            is_bookmarked: isBookmarked.exists,
            user: {
              id: post.user_id,
              username: post.username,
              avatar: post.avatar,
            },
          });
        })
      );

      return {
        posts: postsWithEngagement,
        pagination: { page: String(page), limit: String(limit), total: count, totalPages: calcPages(count, limit) },
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions = content.match(mentionRegex);
    if (!mentions) {
      return [];
    }
    // Return just the usernames without @
    return mentions.map(m => m.substring(1));
  }
}

const postsRepository = new PostsRepositoryImpl();

export default postsRepository;
