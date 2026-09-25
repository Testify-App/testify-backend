import * as dtos from './dto';
import * as entities from './entities';
import {
  BadException,
  NotFoundException,
  InternalServerErrorException,
} from '../../shared/lib/errors';
import {
  FetchPaginatedResponse,
} from '../../shared/helpers';

export interface ProfilesInterface {
  getProfile(payload: dtos.GetProfileDTO): Promise<NotFoundException | entities.ProfileEntity>;
  updateProfile(payload: dtos.UpdateProfileDTO): Promise<BadException | entities.ProfileEntity>;
  
  addToTribe(payload: dtos.AddToTribeDTO): Promise<BadException | entities.UserFollowEntity>;
  removeFromTribe(payload: dtos.RemoveFromTribeDTO): Promise<BadException | void>;
  getTribeMembers(query: dtos.GetTribeMembersQueryDTO): Promise<InternalServerErrorException | FetchPaginatedResponse>;
  searchProfilesByUsername(query: dtos.SearchProfilesByUsernameQueryDTO): Promise<InternalServerErrorException | FetchPaginatedResponse>;
  fetchProfilePostHistoryById(query: dtos.FetchProfilePostHistoryByIdDTO): Promise<NotFoundException | FetchPaginatedResponse>;
  isInTribe(userId: string, followingId: string): Promise<BadException | boolean>;
  getFollowerCount(userId: string): Promise<BadException | number>;
  getFollowers(query: dtos.GetFollowersQueryDTO): Promise<InternalServerErrorException | FetchPaginatedResponse>;
  checkUserExists(userId: string): Promise<boolean>;

  addToCircle(payload: dtos.AddToCircleDTO): Promise<BadException | entities.UserConnectionEntity>;
  removeFromCircle(payload: dtos.RemoveFromCircleDTO): Promise<BadException | void>;
  getCircleMembers(payload: dtos.GetCircleMembersDTO): Promise<InternalServerErrorException | FetchPaginatedResponse>;
  getCircleCount(userId: string): Promise<BadException | number>;
  isInCircle(userId: string, connectedUserId: string): Promise<BadException | boolean>;

  blockUser(payload: dtos.BlockUserDTO): Promise<BadException | void>;
  unblockUser(payload: dtos.UnblockUserDTO): Promise<BadException | void>;
  getBlockedUsers(query: dtos.GetBlockedUsersQueryDTO): Promise<InternalServerErrorException | FetchPaginatedResponse>;
  isBlocked(blockerId: string, blockedId: string): Promise<BadException | boolean>;
};
