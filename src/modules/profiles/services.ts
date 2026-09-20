import * as dtos from './dto';
import * as entities from './entities';
import { ProfilesInterface } from './interface';
import ProfilesRepository from './repositories';
import {
  BadException,
  NotFoundException,
  // ConflictException,
  InternalServerErrorException,
} from '../../shared/lib/errors';
import {
  FetchPaginatedResponse,
} from '../../shared/helpers';

export class ProfilesServiceImpl implements ProfilesInterface {
  public getProfile = async (
    payload: dtos.GetProfileDTO
  ): Promise<NotFoundException | entities.ProfileEntity> => {
    return await ProfilesRepository.getProfile(payload);
  };

  public getByUsername = async (
    payload: dtos.GetByUsernameDTO
  ): Promise<NotFoundException | entities.ProfileEntity> => {
    return await ProfilesRepository.getByUsername(payload);
  };

  public updateProfile = async (
    payload: dtos.UpdateProfileDTO
  ): Promise<BadException | entities.ProfileEntity> => {
    return await ProfilesRepository.updateProfile(payload);
  };

  public addToTribe = async (
    payload: dtos.AddToTribeDTO
  ): Promise<BadException | entities.UserFollowEntity> => {
    // Validate user is not trying to follow themselves
    if (payload.user_id === payload.following_id) {
      return new BadException('You cannot follow yourself');
    }

    // Validate following user exists
    const userExists = await ProfilesRepository.checkUserExists(payload.following_id);
    if (!userExists) {
      return new BadException('User not found');
    }

    return await ProfilesRepository.addToTribe(payload);
  };

  public removeFromTribe = async (
    payload: dtos.RemoveFromTribeDTO
  ): Promise<BadException | void> => {
    return await ProfilesRepository.removeFromTribe(payload);
  };

  public getTribeMembers = async (
    payload: dtos.GetTribeMembersQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> => {
    return await ProfilesRepository.getTribeMembers(payload);
  };

  public searchProfilesByUsername = async (
    payload: dtos.SearchProfilesByUsernameQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> => {
    return await ProfilesRepository.searchProfilesByUsername(payload);
  };

  public fetchProfilePostHistoryById = async (
    payload: dtos.FetchProfilePostHistoryByIdDTO
  ): Promise<NotFoundException | FetchPaginatedResponse> => {
    return await ProfilesRepository.fetchProfilePostHistoryById(payload);
  };

  public isInTribe = async (
    userId: string,
    followingId: string
  ): Promise<BadException | boolean> => {
    return await ProfilesRepository.isInTribe(userId, followingId);
  };

  public getFollowerCount = async (
    userId: string
  ): Promise<BadException | number> => {
    return await ProfilesRepository.getFollowerCount(userId);
  };

  public getFollowers = async (
    payload: dtos.GetFollowersQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> => {
    return await ProfilesRepository.getFollowers(payload);
  };

  public checkUserExists = async (
    userId: string
  ): Promise<boolean> => {
    return await ProfilesRepository.checkUserExists(userId);
  };

  // Circle methods

  public addToCircle = async (
    payload: dtos.AddToCircleDTO
  ): Promise<BadException | entities.UserConnectionEntity> => {
    return await ProfilesRepository.addToCircle(payload);
  };

  public removeFromCircle = async (
    payload: dtos.RemoveFromCircleDTO
  ): Promise<BadException | void> => {
    return await ProfilesRepository.removeFromCircle(payload);
  };

  public getCircleMembers = async (
    payload: dtos.GetCircleMembersDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> => {
    return await ProfilesRepository.getCircleMembers(payload);
  };

  public getCircleCount = async (
    userId: string
  ): Promise<BadException | number> => {
    return await ProfilesRepository.getCircleCount(userId);
  };

  public isInCircle = async (
    userId: string,
    connectedUserId: string
  ): Promise<BadException | boolean> => {
    return await ProfilesRepository.isInCircle(userId, connectedUserId);
  };

}

const ProfilesService = new ProfilesServiceImpl();

export default ProfilesService;
