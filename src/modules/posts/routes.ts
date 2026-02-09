import { Router, RequestHandler } from 'express';
import * as postsValidator from './validator';
import postsController from './controller';
import * as AuthenticationMiddleware from '../../shared/middlewares/auth.middleware';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const verifyAuth: RequestHandler = AuthenticationMiddleware.verifyAuthTokenMiddleware as RequestHandler;


/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

const postsRouter = Router();

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Hello world! This is my first post.
 *               visibility:
 *                 type: string
 *                 enum: [public, followers_only, mentioned_only, private]
 *                 default: public
 *                 example: public
 *               media_attachments:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   $ref: '#/components/schemas/MediaAttachment'
 *               parent_post_id:
 *                 type: string
 *                 format: uuid
 *                 description: For quote reposts
 *               quote_text:
 *                 type: string
 *                 maxLength: 500
 *                 description: Additional text when quoting
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Post created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/Error'
 *     securitySchemes:
 *       bearerAuth:
 *         type: http
 *         scheme: bearer
 *         bearerFormat: JWT
 */
postsRouter.post(
  '/',
  verifyAuth,
  validateDataMiddleware(postsValidator.createPostValidator, 'body'),
  WatchAsyncController(postsController.createPost)
);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get feed of posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, likes_count, reposts_count]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC, asc, desc]
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
postsRouter.get(
  '/',
  verifyAuth,
  validateDataMiddleware(postsValidator.getPostsQueryValidator, 'query'),
  WatchAsyncController(postsController.getPosts)
);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
postsRouter.get(
  '/:post_id',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.getPost)
);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               visibility:
 *                 type: string
 *                 enum: [public, followers_only, mentioned_only, private]
 *               media_attachments:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/MediaAttachment'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
postsRouter.put(
  '/:post_id',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  validateDataMiddleware(postsValidator.updatePostValidator, 'body'),
  WatchAsyncController(postsController.updatePost)
);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
postsRouter.delete(
  '/:post_id',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.deletePost)
);

// Post likes
/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post liked successfully
 *       400:
 *         description: Already liked
 *       404:
 *         description: Post not found
 */
postsRouter.post(
  '/:post_id/like',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.likePost)
);

/**
 * @swagger
 * /posts/{id}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post unliked successfully
 *       404:
 *         description: Post not found
 */
postsRouter.delete(
  '/:id/like',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.unlikePost)
);

/**
 * @swagger
 * /posts/{id}/likes:
 *   get:
 *     summary: Get users who liked a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Likes retrieved successfully
 *       404:
 *         description: Post not found
 */
postsRouter.get(
  '/:id/likes',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  validateDataMiddleware(postsValidator.getLikesQueryValidator, 'query'),
  WatchAsyncController(postsController.getPostLikes)
);

// Reposts
/**
 * @swagger
 * /posts/{id}/repost:
 *   post:
 *     summary: Repost a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post reposted successfully
 *       404:
 *         description: Post not found
 */
postsRouter.post(
  '/:id/repost',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.repost)
);

/**
 * @swagger
 * /posts/{id}/repost:
 *   delete:
 *     summary: Remove a repost
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Repost removed successfully
 *       404:
 *         description: Post not found
 */
postsRouter.delete(
  '/:id/repost',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.unrepost)
);

/**
 * @swagger
 * /posts/{id}/reposts:
 *   get:
 *     summary: Get users who reposted a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reposts retrieved successfully
 *       404:
 *         description: Post not found
 */
postsRouter.get(
  '/:id/reposts',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  validateDataMiddleware(postsValidator.getRepostsQueryValidator, 'query'),
  WatchAsyncController(postsController.getPostReposts)
);

// Quote repost
/**
 * @swagger
 * /posts/{id}/quote:
 *   post:
 *     summary: Quote repost a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parent_post_id
 *             properties:
 *               parent_post_id:
 *                 type: string
 *                 format: uuid
 *               quote_text:
 *                 type: string
 *                 maxLength: 500
 *               visibility:
 *                 type: string
 *                 enum: [public, followers_only, mentioned_only, private]
 *     responses:
 *       201:
 *         description: Quote repost created successfully
 *       404:
 *         description: Parent post not found
 */
postsRouter.post(
  '/:id/quote',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  validateDataMiddleware(postsValidator.createPostValidator, 'body'),
  WatchAsyncController(postsController.quoteRepost)
);

// Bookmarks
/**
 * @swagger
 * /posts/{id}/bookmark:
 *   post:
 *     summary: Bookmark a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post bookmarked successfully
 *       404:
 *         description: Post not found
 */
postsRouter.post(
  '/:id/bookmark',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.bookmarkPost)
);

/**
 * @swagger
 * /posts/{id}/bookmark:
 *   delete:
 *     summary: Remove a bookmark
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *       404:
 *         description: Post not found
 */
postsRouter.delete(
  '/:id/bookmark',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  WatchAsyncController(postsController.unbookmarkPost)
);

// Comments
/**
 * @swagger
 * /posts/{id}/comments:
 *   post:
 *     summary: Create a comment on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *               parent_comment_id:
 *                 type: string
 *                 format: uuid
 *               media_attachments:
 *                 type: array
 *                 maxItems: 4
 *                 items:
 *                   $ref: '#/components/schemas/MediaAttachment'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       404:
 *         description: Post not found
 */
postsRouter.post(
  '/:id/comments',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  validateDataMiddleware(postsValidator.createCommentValidator, 'body'),
  WatchAsyncController(postsController.createComment)
);

/**
 * @swagger
 * /posts/{id}/comments:
 *   get:
 *     summary: Get comments on a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Post not found
 */
postsRouter.get(
  '/:id/comments',
  verifyAuth,
  validateDataMiddleware(postsValidator.postIdValidator, 'params'),
  validateDataMiddleware(postsValidator.getCommentsQueryValidator, 'query'),
  WatchAsyncController(postsController.getComments)
);

/**
 * @swagger
 * /posts/comments/{id}/like:
 *   post:
 *     summary: Like a comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment liked successfully
 *       404:
 *         description: Comment not found
 */
postsRouter.post(
  '/comments/:id/like',
  verifyAuth,
  validateDataMiddleware(postsValidator.commentIdValidator, 'params'),
  WatchAsyncController(postsController.likeComment)
);

/**
 * @swagger
 * /posts/comments/{id}/like:
 *   delete:
 *     summary: Unlike a comment
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment unliked successfully
 *       404:
 *         description: Comment not found
 */
postsRouter.delete(
  '/comments/:id/like',
  verifyAuth,
  validateDataMiddleware(postsValidator.commentIdValidator, 'params'),
  WatchAsyncController(postsController.unlikeComment)
);

// User posts and bookmarks
/**
 * @swagger
 * /posts/user/{userId}:
 *   get:
 *     summary: Get posts by a user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User posts retrieved successfully
 */
postsRouter.get(
  '/user/:userId',
  verifyAuth,
  validateDataMiddleware(postsValidator.userIdValidator, 'params'),
  validateDataMiddleware(postsValidator.getPostsQueryValidator, 'query'),
  WatchAsyncController(postsController.getUserPosts)
);

/**
 * @swagger
 * /posts/bookmarks:
 *   get:
 *     summary: Get user's bookmarked posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmarks retrieved successfully
 */
postsRouter.get(
  '/bookmarks',
  verifyAuth,
  validateDataMiddleware(postsValidator.getPostsQueryValidator, 'query'),
  WatchAsyncController(postsController.getUserBookmarks)
);

export default postsRouter;
