import * as dtos from './dto';
import * as entities from './entities';
import { ProfilesInterface } from './interface';
import ProfilesRepository from './repositories';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';

export class ProfilesServiceImpl implements ProfilesInterface {
  public getProfile = async (
    payload: dtos.GetProfileDTO
  ): Promise<NotFoundException | entities.ProfileEntity> => {
    return await ProfilesRepository.getProfile(payload);
  };

  public updateProfile = async (
    payload: dtos.UpdateProfileDTO
  ): Promise<BadException | entities.ProfileEntity> => {
    return await ProfilesRepository.updateProfile(payload);
  };
}

const ProfilesService = new ProfilesServiceImpl();

export default ProfilesService;
