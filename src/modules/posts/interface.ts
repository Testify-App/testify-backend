import * as dtos from './dto';
import * as entities from './entities';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';
import {
  FetchPaginatedResponse,
} from '../../shared/helpers';


export interface PostsInterface {
  createPost(payload: dtos.CreatePostDTO): Promise<BadException | entities.PostEntity>;
  getPosts(query: dtos.GetPostsQueryDTO): Promise<BadException | FetchPaginatedResponse>;
  getPost(query: dtos.GetPostQueryDTO): Promise<NotFoundException | entities.PostWithUserEntity>;
  updatePost(payload: dtos.UpdatePostDTO): Promise<BadException | entities.PostEntity>;
  deletePost(payload: dtos.DeletePostDTO): Promise<NotFoundException | { message: string }>;
  likePost(payload: dtos.GetPostQueryDTO): Promise<NotFoundException | { message: string; is_liked: boolean }>;
  
  unlikePost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string }>;
  
  repost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string; is_reposted: boolean }>;
  
  unrepost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string }>;
  
  quoteRepost(payload: dtos.CreatePostDTO): Promise<BadException | entities.PostEntity>;

  bookmarkPost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string; is_bookmarked: boolean }>;
  
  unbookmarkPost(
    userId: string,
    postId: string
  ): Promise<BadException | NotFoundException | { message: string }>;
  
  getPostLikes(
    postId: string,
    query: dtos.GetLikesQueryDTO
  ): Promise<BadException | NotFoundException | { likes: entities.PostLikeEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }>;
  
  getPostReposts(
    postId: string,
    query: dtos.GetRepostsQueryDTO
  ): Promise<BadException | NotFoundException | { reposts: entities.RepostEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }>;
  
  createComment(
    userId: string,
    postId: string,
    payload: dtos.CreateCommentDTO
  ): Promise<BadException | NotFoundException | entities.CommentEntity>;
  
  getComments(
    userId: string,
    postId: string,
    query: dtos.GetCommentsQueryDTO
  ): Promise<BadException | NotFoundException | { comments: entities.CommentWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }>;
  
  likeComment(
    userId: string,
    commentId: string
  ): Promise<BadException | NotFoundException | { message: string; is_liked: boolean }>;
  
  unlikeComment(
    userId: string,
    commentId: string
  ): Promise<BadException | NotFoundException | { message: string }>;
  
  getUserPosts(
    userId: string,
    targetUserId: string,
    query: dtos.GetPostsQueryDTO
  ): Promise<BadException | { posts: entities.PostWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }>;
  
  getUserBookmarks(
    userId: string,
    query: dtos.GetPostsQueryDTO
  ): Promise<BadException | { posts: entities.PostWithUserEntity[]; pagination: { page: string; limit: string; total: number; totalPages: number } }>;
}
