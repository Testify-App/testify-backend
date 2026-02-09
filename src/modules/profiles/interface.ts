import * as dtos from './dto';
import * as entities from './entities';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';

export interface ProfilesInterface {
  getProfile(payload: dtos.GetProfileDTO): Promise<NotFoundException | entities.ProfileEntity>;
  updateProfile(payload: dtos.UpdateProfileDTO): Promise<BadException | entities.ProfileEntity>;
};
