import * as dtos from './dto';
import * as entities from './entities';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';

export interface ProfilesInterface {
  getProfile(payload: dtos.GetProfileDTO): Promise<NotFoundException | entities.ProfileEntity>;
  updateProfile(payload: dtos.UpdateProfileDTO): Promise<BadException | entities.ProfileEntity>;
  
  // Tribe methods
  addToTribe(payload: dtos.AddToTribeDTO): Promise<BadException | entities.UserFollowEntity>;
  removeFromTribe(payload: dtos.RemoveFromTribeDTO): Promise<BadException | void>;
  getTribeMembers(payload: dtos.GetTribeMembersDTO): Promise<BadException | entities.TribeMemberEntity[]>;
  getTribeCount(userId: string): Promise<BadException | number>;
  isInTribe(userId: string, followingId: string): Promise<BadException | boolean>;
  getFollowerCount(userId: string): Promise<BadException | number>;
  checkUserExists(userId: string): Promise<boolean>;

  // Circle methods
  sendCircleRequest(payload: dtos.SendCircleRequestDTO): Promise<BadException | entities.CircleRequestEntity>;
  acceptCircleRequest(payload: dtos.AcceptCircleRequestDTO): Promise<BadException | entities.UserConnectionEntity>;
  rejectCircleRequest(payload: dtos.RejectCircleRequestDTO): Promise<BadException | void>;
  removeFromCircle(payload: dtos.RemoveFromCircleDTO): Promise<BadException | void>;
  getCircleMembers(payload: dtos.GetCircleMembersDTO): Promise<BadException | entities.CircleMemberEntity[]>;
  getCircleCount(userId: string): Promise<BadException | number>;
  isInCircle(userId: string, connectedUserId: string): Promise<BadException | boolean>;
  getPendingRequests(userId: string): Promise<BadException | entities.CircleRequestEntity[]>;
  getSentRequests(userId: string): Promise<BadException | entities.CircleRequestEntity[]>;
};
