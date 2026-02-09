import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import PostsService from './services';
import { User } from '../../shared/interface';
import { fnRequest } from '../../shared/types';
import logger from '../../shared/services/logger';
import * as ResponseBuilder from '../../shared/lib/api-response';
import {
  BadException,
  NotFoundException,
  InternalServerErrorException,
} from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class PostsController {
  public createPost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.CreatePostDTO(req.body);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.createPost(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Post created successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Post created successfully', StatusCodes.CREATED, response);
  };

  public getPosts: fnRequest = async (req: AuthenticatedRequest, res) => {
    const query = new dtos.GetPostsQueryDTO(req.query);
    query.user_id = req.user?.id as string;
    const response = await PostsService.getPosts(query);
    if (response instanceof InternalServerErrorException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    logger.info('Posts retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Posts retrieved successfully', StatusCodes.OK, response);
  };

  public getPost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const query = new dtos.GetPostQueryDTO(req.params);
    const response = await PostsService.getPost(query);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Post retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Post retrieved successfully', StatusCodes.OK, response);
  };

  public updatePost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.UpdatePostDTO(req.body);
    payload.post_id = req.params.post_id;
    payload.user_id = req.user?.id as string;
    const response = await PostsService.updatePost(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Post updated successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Post updated successfully', StatusCodes.OK, response);
  };

  public deletePost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.DeletePostDTO(req.params);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.deletePost(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Post deleted successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public likePost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.GetPostQueryDTO(req.params);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.likePost(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Post liked successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public unlikePost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.GetPostQueryDTO(req.params);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.unlikePost(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Post unliked successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public repost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.GetPostQueryDTO(req.params);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.repost(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Post reposted successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public unrepost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.GetPostQueryDTO(req.params);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.unrepost(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Repost removed successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public quoteRepost: fnRequest = async (req: AuthenticatedRequest, res) => {
    let payload = new dtos.CreatePostDTO(req.body);
    payload.user_id = req.user?.id as string;
    const response = await PostsService.quoteRepost(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Quote repost created successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Quote repost created successfully', StatusCodes.CREATED, response);
  };

  public bookmarkPost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const postId = req.params.id;
    const userId = req.user?.id as string;
    const response = await PostsService.bookmarkPost(userId, postId);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Post bookmarked successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, { is_bookmarked: response.is_bookmarked });
  };

  public unbookmarkPost: fnRequest = async (req: AuthenticatedRequest, res) => {
    const postId = req.params.id;
    const userId = req.user?.id as string;
    const response = await PostsService.unbookmarkPost(userId, postId);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Bookmark removed successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public getPostLikes: fnRequest = async (req: AuthenticatedRequest, res) => {
    const postId = req.params.id;
    const query = new dtos.GetLikesQueryDTO(req.query);
    const response = await PostsService.getPostLikes(postId, query);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Post likes retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Post likes retrieved successfully', StatusCodes.OK, response);
  };

  public getPostReposts: fnRequest = async (req: AuthenticatedRequest, res) => {
    const postId = req.params.id;
    const query = new dtos.GetRepostsQueryDTO(req.query);
    const response = await PostsService.getPostReposts(postId, query);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Post reposts retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Post reposts retrieved successfully', StatusCodes.OK, response);
  };

  public createComment: fnRequest = async (req: AuthenticatedRequest, res) => {
    const payload = new dtos.CreateCommentDTO(req.body);
    const postId = req.params.id;
    const userId = req.user?.id as string;
    const response = await PostsService.createComment(userId, postId, payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Comment created successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Comment created successfully', StatusCodes.CREATED, response);
  };

  public getComments: fnRequest = async (req: AuthenticatedRequest, res) => {
    const postId = req.params.id;
    const query = new dtos.GetCommentsQueryDTO(req.query);
    const userId = req.user?.id as string;
    const response = await PostsService.getComments(userId, postId, query);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Comments retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'Comments retrieved successfully', StatusCodes.OK, response);
  };

  public likeComment: fnRequest = async (req: AuthenticatedRequest, res) => {
    const commentId = req.params.id;
    const userId = req.user?.id as string;
    const response = await PostsService.likeComment(userId, commentId);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Comment liked successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK, { is_liked: response.is_liked });
  };

  public unlikeComment: fnRequest = async (req: AuthenticatedRequest, res) => {
    const commentId = req.params.id;
    const userId = req.user?.id as string;
    const response = await PostsService.unlikeComment(userId, commentId);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Comment unliked successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, response.message, StatusCodes.OK);
  };

  public getUserPosts: fnRequest = async (req: AuthenticatedRequest, res) => {
    const targetUserId = req.params.userId;
    const query = new dtos.GetPostsQueryDTO(req.query);
    const userId = req.user?.id as string;
    const response = await PostsService.getUserPosts(userId, targetUserId, query);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('User posts retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'User posts retrieved successfully', StatusCodes.OK, response);
  };

  public getUserBookmarks: fnRequest = async (req: AuthenticatedRequest, res) => {
    const query = new dtos.GetPostsQueryDTO(req.query);
    const userId = req.user?.id as string;
    const response = await PostsService.getUserBookmarks(userId, query);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'posts.controller.ts');
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('User bookmarks retrieved successfully', 'posts.controller.ts');
    return ResponseBuilder.success(res, 'User bookmarks retrieved successfully', StatusCodes.OK, response);
  };
}

const postsController = new PostsController();

export default postsController;
