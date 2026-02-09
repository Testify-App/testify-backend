import * as dtos from './dto';
import * as entities from './entities';
import { PostsInterface } from './interface';
import PostsRepository from './repositories';
import {
  BadException,
  NotFoundException,
  InternalServerErrorException,
} from '../../shared/lib/errors';
import {
  FetchPaginatedResponse,
} from '../../shared/helpers';

export class PostsServiceImpl implements PostsInterface {
  public createPost = async (
    payload: dtos.CreatePostDTO
  ): Promise<BadException | entities.PostEntity> => {
    return await PostsRepository.createPost(payload);
  };

  public getPosts = async (
    query: dtos.GetPostsQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> => {
    return await PostsRepository.getPosts(query);
  };

  public getPost = async (
    query: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | entities.PostWithUserEntity> => {
    return await PostsRepository.getPost(query);
  };

  public updatePost = async (
    payload: dtos.UpdatePostDTO
  ): Promise<BadException | entities.PostEntity> => {
    return await PostsRepository.updatePost(payload);
  };

  public deletePost = async (
    payload: dtos.DeletePostDTO
  ): Promise<NotFoundException | { message: string }> => {
    return await PostsRepository.deletePost(payload);
  };

  public likePost = async (
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string; is_liked: boolean }> => {
    return await PostsRepository.likePost(payload);
  };

  public unlikePost = async (
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string }> => {
    return await PostsRepository.unlikePost(payload);
  };

  public repost = async (
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string; is_reposted: boolean }> => {
    return await PostsRepository.repost(payload);
  };

  public unrepost = async (
    payload: dtos.GetPostQueryDTO
  ): Promise<NotFoundException | { message: string }> => {
    return await PostsRepository.unrepost(payload);
  };

  public quoteRepost = async (
    payload: dtos.CreatePostDTO
  ): Promise<BadException | entities.PostEntity> => {
    return await PostsRepository.quoteRepost(payload);
  };

  public bookmarkPost = async (
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string; is_bookmarked: boolean }> => {
    return await PostsRepository.bookmarkPost(userId, postId);
  };

  public unbookmarkPost = async (
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await PostsRepository.unbookmarkPost(userId, postId);
  };

  public getPostLikes = async (
    postId: string,
    query: dtos.GetLikesQueryDTO
  ): Promise<BadException | NotFoundException | { likes: entities.PostLikeEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> => {
    return await PostsRepository.getPostLikes(postId, query);
  };

  public getPostReposts = async (
    postId: string,
    query: dtos.GetRepostsQueryDTO
  ): Promise<BadException | NotFoundException | { reposts: entities.RepostEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> => {
    return await PostsRepository.getPostReposts(postId, query);
  };

  public createComment = async (
    userId: string,
    postId: string,
    payload: dtos.CreateCommentDTO
  ): Promise<BadException | NotFoundException | entities.CommentEntity> => {
    return await PostsRepository.createComment(userId, postId, payload);
  };

  public getComments = async (
    userId: string,
    postId: string,
    query: dtos.GetCommentsQueryDTO
  ): Promise<BadException | NotFoundException | { comments: entities.CommentWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> => {
    return await PostsRepository.getComments(userId, postId, query);
  };

  public likeComment = async (
    userId: string,
    commentId: string
  ): Promise<BadException | NotFoundException | { message: string; is_liked: boolean }> => {
    return await PostsRepository.likeComment(userId, commentId);
  };

  public unlikeComment = async (
    userId: string,
    commentId: string
  ): Promise<BadException | NotFoundException | { message: string }> => {
    return await PostsRepository.unlikeComment(userId, commentId);
  };

  public getUserPosts = async (
    userId: string,
    targetUserId: string,
    query: dtos.GetPostsQueryDTO
  ): Promise<BadException | { posts: entities.PostWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> => {
    return await PostsRepository.getUserPosts(userId, targetUserId, query);
  };

  public getUserBookmarks = async (
    userId: string,
    query: dtos.GetPostsQueryDTO
  ): Promise<BadException | { posts: entities.PostWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }> => {
    return await PostsRepository.getUserBookmarks(userId, query);
  };
}

const PostsService = new PostsServiceImpl();

export default PostsService;
