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
  createNotification,
  FetchPaginatedResponse,
} from '../../shared/helpers';

const CIRCLE_MEMBER_LIMIT = 12;

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

      // Notify the followed user (fire-and-forget)
      createNotification({
        user_id: payload.following_id,
        actor_id: payload.user_id,
        type: 'follow',
        entity_type: 'user',
        entity_id: payload.user_id,
        data: {},
      }).catch(() => {});

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
        params: [user_id, payload.search || null],
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
          u.header_image,
          u.bio,
          u.display_name,
          COUNT(DISTINCT uf.follower_id) as tribe_members_count,
          COUNT(DISTINCT uf.follower_id) as followers_count,
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

  public async getFollowers(
    payload: dtos.GetFollowersQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id, target_user_id } = payload as {
        page?: string;
        limit?: string;
        user_id: string;
        target_user_id: string;
      };

      const [{ count }, followers] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.getFollowers,
        params: [target_user_id, payload.search || null, user_id],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        followers,
      };
    } catch (error) {
      return new InternalServerErrorException(`${error.message}`);
    }
  }

  public async addToCircle(
    payload: dtos.AddToCircleDTO
  ): Promise<BadException | entities.UserConnectionEntity> {
    try {
      if (payload.user_id === payload.connected_user_id) {
        return new BadException('You cannot add yourself to your Circle');
      }

      const result = await db.tx(async (t) => {
        const senderCount = await t.one(ProfilesQuery.getCircleCount, [payload.user_id]);
        const targetCount = await t.one(ProfilesQuery.getCircleCount, [payload.connected_user_id]);

        if (parseInt(senderCount?.total || '0', 10) >= CIRCLE_MEMBER_LIMIT) {
          throw new BadException(`Your Circle is full (max ${CIRCLE_MEMBER_LIMIT} members)`);
        }
        if (parseInt(targetCount?.total || '0', 10) >= CIRCLE_MEMBER_LIMIT) {
          throw new BadException(`This user's Circle is full (max ${CIRCLE_MEMBER_LIMIT} members)`);
        }

        const forward = await t.oneOrNone(ProfilesQuery.addToCircle, [
          payload.user_id,
          payload.connected_user_id,
        ]);

        if (!forward) {
          throw new BadException('User is already in your Circle');
        }

        await t.none(ProfilesQuery.addToCircle, [
          payload.connected_user_id,
          payload.user_id,
        ]);

        return forward;
      });

      // Notify the added user (fire-and-forget)
      createNotification({
        user_id: payload.connected_user_id,
        actor_id: payload.user_id,
        type: 'circle_accepted',
        entity_type: 'user',
        entity_id: payload.user_id,
        data: {},
      }).catch(() => {});

      return new entities.UserConnectionEntity(result);
    } catch (error) {
      if (error instanceof BadException) return error;
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

      // Notify the removed user (fire-and-forget)
      createNotification({
        user_id: payload.connected_user_id,
        actor_id: payload.user_id,
        type: 'circle_removed',
        entity_type: 'user',
        entity_id: payload.user_id,
        data: {},
      }).catch(() => {});

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

      const [{ count }, circle_members] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.getCircleMembers,
        params: [user_id, payload.search || null],
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

  public async blockUser(
    payload: dtos.BlockUserDTO
  ): Promise<BadException | void> {
    try {
      if (payload.user_id === payload.blocked_id) {
        return new BadException('You cannot block yourself');
      }

      await db.tx(async (t) => {
        const blocked = await t.oneOrNone(ProfilesQuery.blockUser, [payload.user_id, payload.blocked_id]);
        if (!blocked) {
          throw new BadException('User is already blocked');
        }

        // Blocking removes any existing Tribe/Circle relationship in both directions
        await t.none(ProfilesQuery.removeFromTribe, [payload.user_id, payload.blocked_id]);
        await t.none(ProfilesQuery.removeFromTribe, [payload.blocked_id, payload.user_id]);
        await t.none(ProfilesQuery.removeFromCircle, [payload.user_id, payload.blocked_id]);
      });

      return;
    } catch (error) {
      if (error instanceof BadException) return error;
      return new BadException(`${error.message}`);
    }
  }

  public async unblockUser(
    payload: dtos.UnblockUserDTO
  ): Promise<BadException | void> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.unblockUser, [payload.user_id, payload.blocked_id]);
      if (!result) {
        return new BadException('User is not blocked');
      }
      return;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getBlockedUsers(
    query: dtos.GetBlockedUsersQueryDTO
  ): Promise<InternalServerErrorException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id } = query as { page?: string; limit?: string; user_id: string };

      const [{ count }, blocked_users] = await fetchResourceByPage({
        page,
        limit,
        getResources: ProfilesQuery.getBlockedUsers,
        params: [user_id, query.search || null],
      });

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        blocked_users,
      };
    } catch (error) {
      return new InternalServerErrorException(`${error.message}`);
    }
  }

  public async isBlocked(
    blockerId: string,
    blockedId: string
  ): Promise<BadException | boolean> {
    try {
      const result = await db.oneOrNone(ProfilesQuery.isBlocked, [blockerId, blockedId]);
      return result?.exists || false;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

};

const ProfilesRepository = new ProfilesRepositoryImpl();

export default ProfilesRepository;
