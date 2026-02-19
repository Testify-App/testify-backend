import * as dtos from './dto';
import * as entities from './entities';
import { ProfilesInterface } from './interface';
import ProfilesRepository from './repositories';
import {
  BadException,
  NotFoundException,
  ConflictException,
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

  public checkUserExists = async (
    userId: string
  ): Promise<boolean> => {
    return await ProfilesRepository.checkUserExists(userId);
  };

  // Circle methods

  public sendCircleRequest = async (
    payload: dtos.SendCircleRequestDTO
  ): Promise<BadException | entities.CircleRequestEntity> => {
    // Validate user is not trying to add themselves
    if (payload.user_id === payload.connected_user_id) {
      return new BadException('You cannot send a Circle request to yourself');
    }

    // Validate connected user exists
    const userExists = await ProfilesRepository.checkUserExists(payload.connected_user_id);
    if (!userExists) {
      return new NotFoundException('User not found');
    }

    // Check if there's already a pending request
    const hasPending = await ProfilesRepository.hasPendingRequest(payload.user_id, payload.connected_user_id);
    if (hasPending) {
      return new ConflictException('A Circle request is already pending');
    }

    // Check if already connected
    const isConnected = await ProfilesRepository.isInCircle(payload.user_id, payload.connected_user_id);
    if (isConnected) {
      return new ConflictException('User is already in your Circle');
    }

    return await ProfilesRepository.sendCircleRequest(payload);
  };

  public acceptCircleRequest = async (
    payload: dtos.AcceptCircleRequestDTO
  ): Promise<BadException | entities.UserConnectionEntity> => {
    // Get the request
    const request = await ProfilesRepository.getRequestById(payload.request_id, payload.user_id);
    if (!request) {
      return new NotFoundException('Circle request not found');
    }

    if (request.status !== 'pending') {
      return new BadException('This request has already been processed');
    }

    return await ProfilesRepository.acceptCircleRequest(payload);
  };

  public rejectCircleRequest = async (
    payload: dtos.RejectCircleRequestDTO
  ): Promise<BadException | void> => {
    // Get the request
    const request = await ProfilesRepository.getRequestById(payload.request_id, payload.user_id);
    if (!request) {
      return new BadException('Circle request not found');
    }

    if (request.status !== 'pending') {
      return new BadException('This request has already been processed');
    }

    return await ProfilesRepository.rejectCircleRequest(payload);
  };

  public removeFromCircle = async (
    payload: dtos.RemoveFromCircleDTO
  ): Promise<BadException | void> => {
    return await ProfilesRepository.removeFromCircle(payload);
  };

  public getCircleMembers = async (
    payload: dtos.GetCircleMembersDTO
  ): Promise<BadException | entities.CircleMemberEntity[]> => {
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

  public getPendingRequests = async (
    userId: string
  ): Promise<BadException | entities.CircleRequestEntity[]> => {
    return await ProfilesRepository.getPendingRequests(userId);
  };

  public getSentRequests = async (
    userId: string
  ): Promise<BadException | entities.CircleRequestEntity[]> => {
    return await ProfilesRepository.getSentRequests(userId);
  };
}

const ProfilesService = new ProfilesServiceImpl();

export default ProfilesService;
