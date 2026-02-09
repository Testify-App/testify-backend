import * as dtos from './dto';
import * as entities from './entities';
import ProfilesQuery from './query';
import { db } from '../../config/database';
import { ProfilesInterface } from './interface';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';

export class ProfilesRepositoryImpl implements ProfilesInterface {
  public async getProfile(
    payload: dtos.GetProfileDTO
  ): Promise<NotFoundException | entities.ProfileEntity> {
    try {
      const profile = await db.oneOrNone(ProfilesQuery.getProfileByUserId, [payload.user_id]);
      if (!profile) {
        return new NotFoundException('Profile not found');
      }

      return new entities.ProfileEntity(profile);
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async updateProfile(
    payload: dtos.UpdateProfileDTO
  ): Promise<BadException | entities.ProfileEntity> {
    try {
      const profile = await db.one(ProfilesQuery.updateProfile, [
        payload.user_id,
        payload.first_name || null,
        payload.last_name || null,
        payload.country_code || null,
        payload.phone_number || null,
        payload.avatar || null,
        payload.username || null,
        payload.bio || null,
        payload.instagram || null,
        payload.youtube || null,
        payload.twitter || null,
      ]);

      return new entities.ProfileEntity(profile);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };
};

const ProfilesRepository = new ProfilesRepositoryImpl();

export default ProfilesRepository;
