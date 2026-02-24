import * as dtos from './dto';
import ProfilesQuery from './query';
import * as entities from './entities';
import { db } from '../../config/database';
import { ProfilesInterface } from './interface';
import {
  BadException,
  NotFoundException,
  InternalServerErrorException,
} from '../../shared/lib/errors';
import {
  calcPages,
  fetchResourceByPage,
  FetchPaginatedResponse,
} from '../../shared/helpers';

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

  public async getByUsername(
    payload: dtos.GetByUsernameDTO
  ): Promise<NotFoundException | entities.ProfileEntity> {
    try {
      const profile = await db.oneOrNone(ProfilesQuery.getByUsername, [payload.username]);
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
        payload.display_name || null,
        payload.header_image || null,
      ]);

      return new entities.ProfileEntity(profile);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async checkUserExists(
    userId: string
  ): Promise<boolean> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.checkUserExists, [userId]);
      return result?.exists || false;
    } catch (error) {
      return false;
    }
  }

  public async addToTribe(
    payload: dtos.AddToTribeDTO
  ): Promise<BadException | entities.UserFollowEntity> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.addToTribe, [
        payload.user_id,
        payload.following_id,
      ]);

      if (!result) {
        return new BadException('User is already in your Tribe');
      }

      return new entities.UserFollowEntity(result);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async removeFromTribe(
    payload: dtos.RemoveFromTribeDTO
  ): Promise<BadException | void> {
    try {
      await db.none(ProfilesQuery.removeFromTribe, [
        payload.user_id,
        payload.following_id,
      ]);
      return;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
  
  public async getTribeMembers(
    payload: dtos.GetTribeMembersQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id } = payload as { page?: string; limit?: string; user_id: string };
      const [{ count }, members] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.getTribeMembers,
        params: [user_id],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        members,
      };
    } catch (error) {
      return new InternalServerErrorException(`${error.message}`);
    }
  };

  public async searchProfilesByUsername(
    payload: dtos.SearchProfilesByUsernameQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', search } = payload as { page?: string; limit?: string; search: string };
      const searchPattern = `%${search}%`;
      const [{ count }, profiles] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.searchProfilesByUsername,
        params: [searchPattern],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        profiles,
      };
    } catch (error) {
      return new InternalServerErrorException(`${error.message}`);
    }
  };

  public async fetchProfilePostHistoryById(
    payload: dtos.FetchProfilePostHistoryByIdDTO
  ): Promise<NotFoundException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20' } = payload as { page?: string; limit?: string; };

      const following_id_details = await db.oneOrNone(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.country_code,
          u.phone_number,
          u.email,
          u.avatar,
          u.username,
          u.bio,
          u.display_name,
          COUNT(DISTINCT uf.follower_id) as tribe_members_count,
          CASE WHEN EXISTS (
            SELECT 1 FROM user_follows 
            WHERE follower_id = $2 AND following_id = u.id
          ) THEN true ELSE false END as is_following
        FROM users u
        LEFT JOIN user_follows uf ON u.id = uf.following_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [payload.following_id, payload.user_id]);
      
      const [{ count }, posts] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.fetchProfilePostHistoryById,
        params: [payload.following_id],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        following_id_details,
        posts,
      };
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async isInTribe(
    userId: string,
    followingId: string
  ): Promise<BadException | boolean> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.isInTribe, [userId, followingId]);
      return result?.exists || false;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getFollowerCount(
    userId: string
  ): Promise<BadException | number> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.getFollowerCount, [userId]);
      return parseInt(result?.total || '0', 10);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async sendCircleRequest(
    payload: dtos.SendCircleRequestDTO
  ): Promise<BadException | entities.CircleRequestEntity> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.sendCircleRequest, [
        payload.user_id,
        payload.connected_user_id,
      ]);

      if (!result) {
        return new BadException('Circle request already exists');
      }

      return new entities.CircleRequestEntity(result);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async acceptCircleRequest(
    payload: dtos.AcceptCircleRequestDTO
  ): Promise<BadException | entities.UserConnectionEntity> {
    try {
      // First update the request status to accepted
      const result = await db.tx(async (t) => {
        // Update the original request
        const updated = await t.oneOrNone(ProfilesQuery.acceptCircleRequest, [
          payload.request_id,
          payload.user_id,
        ]);

        if (!updated) {
          return null;
        }

        // Get the original request to find who sent it
        const request = await t.oneOrNone(
          'SELECT * FROM user_connections WHERE id = $1',
          [payload.request_id]
        );

        if (!request) {
          return null;
        }

        // Create mutual connection
        await t.none(ProfilesQuery.createMutualConnection, [
          payload.user_id,
          request.user_id,
        ]);

        return updated;
      });

      if (!result) {
        return new BadException('Circle request not found or already processed');
      }

      return new entities.UserConnectionEntity(result);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async rejectCircleRequest(
    payload: dtos.RejectCircleRequestDTO
  ): Promise<BadException | void> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.rejectCircleRequest, [
        payload.request_id,
        payload.user_id,
      ]);

      if (!result) {
        return new BadException('Circle request not found or already processed');
      }

      return;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async removeFromCircle(
    payload: dtos.RemoveFromCircleDTO
  ): Promise<BadException | void> {
    try {
      await db.none(ProfilesQuery.removeFromCircle, [
        payload.user_id,
        payload.connected_user_id,
      ]);

      return;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getCircleMembers(
    payload: dtos.GetCircleMembersDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id, } = payload as { page?: string; limit?: string; user_id: string };
      const searchPattern = payload.search ? `%${payload.search}%` : `%`;

      const [{ count }, circle_members] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.getCircleMembers,
        params: [user_id, searchPattern],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        circle_members,
      };
    } catch (error) {
      return new InternalServerErrorException(`${error.message}`);
    }
  };

  public async getCircleCount(
    userId: string
  ): Promise<BadException | number> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.getCircleCount, [userId]);
      return parseInt(result?.total || '0', 10);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async isInCircle(
    userId: string,
    connectedUserId: string
  ): Promise<BadException | boolean> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.isInCircle, [userId, connectedUserId]);
      return result?.exists || false;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getPendingRequests(
    userId: string
  ): Promise<BadException | entities.CircleRequestEntity[]> {
    try {
      const requests = await db.manyOrNone(ProfilesQuery.getPendingRequests, [userId]);
      return requests.map((request: any) => new entities.CircleRequestEntity(request));
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getSentRequests(
    userId: string
  ): Promise<BadException | entities.CircleRequestEntity[]> {
    try {
      const requests = await db.manyOrNone(ProfilesQuery.getSentRequests, [userId]);
      return requests.map((request: any) => new entities.CircleRequestEntity(request));
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async hasPendingRequest(
    userId: string,
    connectedUserId: string
  ): Promise<boolean> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.hasPendingRequest, [userId, connectedUserId]);
      return result?.exists || false;
    } catch (error) {
      return false;
    }
  }

  public async getRequestById(
    requestId: string,
    userId: string
  ): Promise<entities.CircleRequestEntity | null> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.getRequestById, [requestId, userId]);
      return result ? new entities.CircleRequestEntity(result) : null;
    } catch (error) {
      return null;
    }
  }
};

const ProfilesRepository = new ProfilesRepositoryImpl();

export default ProfilesRepository;
