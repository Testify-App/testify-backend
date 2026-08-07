import * as dtos from './dto';
import * as entities from './entities';
import CommunitiesQuery from './query';
import { CommunitiesInterface } from './interface';
import { db } from '../../config/database';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { calcPages, fetchResourceByPage, FetchPaginatedResponse, parseContentSegments } from '../../shared/helpers';

function mapToEntity(row: any): entities.CommunityWithOwnerEntity {
  return new entities.CommunityWithOwnerEntity({
    ...row,
    rules: row.rules || [],
    owner: {
      id: row.owner_id,
      username: row.owner_username,
      avatar: row.owner_avatar,
      display_name: row.owner_display_name,
    },
  });
}

export class CommunitiesRepositoryImpl implements CommunitiesInterface {
  public async createCommunity(
    payload: dtos.CreateCommunityDTO
  ): Promise<BadException | entities.CommunityWithOwnerEntity> {
    try {
      const community = await db.one(CommunitiesQuery.createCommunity, [
        payload.user_id,
        payload.name,
        payload.description || null,
        payload.category || null,
        payload.avatar || null,
        payload.cover_image || null,
        payload.visibility || 'public',
        JSON.stringify(payload.rules || []),
      ]);

      const full = await db.one(CommunitiesQuery.getCommunityById, [community.id]);
      return mapToEntity(full);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getCommunity(
    payload: dtos.GetCommunityDTO
  ): Promise<NotFoundException | entities.CommunityWithOwnerEntity> {
    try {
      const community = await db.oneOrNone(CommunitiesQuery.getCommunityById, [payload.community_id]);
      if (!community) return new NotFoundException('Community not found');

      const memberRow = await db.oneOrNone(CommunitiesQuery.getMemberStatus, [
        payload.community_id,
        payload.user_id,
      ]);

      return mapToEntity({ ...community, member_status: memberRow?.status || null });
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  }

  public async getMyCommunities(
    payload: dtos.GetMyCommunitiesQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id } = payload as { page?: string; limit?: string; user_id: string };
      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getMyCommunities,
        params: [user_id],
      });

      const communities = rows.map((row: any) => mapToEntity(row));

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        communities,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getJoinedCommunities(
    payload: dtos.GetJoinedCommunitiesQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', user_id } = payload as { page?: string; limit?: string; user_id: string };
      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getJoinedCommunities,
        params: [user_id],
      });

      const communities = rows.map((row: any) => mapToEntity(row));

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        communities,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async updateCommunity(
    payload: dtos.UpdateCommunityDTO
  ): Promise<BadException | NotFoundException | entities.CommunityWithOwnerEntity> {
    try {
      const updated = await db.oneOrNone(CommunitiesQuery.updateCommunity, [
        payload.community_id,
        payload.name || null,
        payload.description !== undefined ? payload.description : null,
        payload.category !== undefined ? payload.category : null,
        payload.avatar !== undefined ? payload.avatar : null,
        payload.cover_image !== undefined ? payload.cover_image : null,
        payload.visibility || null,
        payload.rules !== undefined ? JSON.stringify(payload.rules) : null,
        payload.user_id,
      ]);

      if (!updated) return new NotFoundException('Community not found or you are not the owner');

      const full = await db.one(CommunitiesQuery.getCommunityById, [updated.id]);
      return mapToEntity(full);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async deleteCommunity(
    payload: dtos.DeleteCommunityDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const exists = await db.oneOrNone(
        'SELECT id FROM communities WHERE id = $1 AND owner_id = $2',
        [payload.community_id, payload.user_id]
      );
      if (!exists) return new NotFoundException('Community not found or you are not the owner');

      await db.none(CommunitiesQuery.deleteCommunity, [payload.community_id, payload.user_id]);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async joinCommunity(
    payload: dtos.JoinCommunityDTO
  ): Promise<BadException | NotFoundException | { status: string }> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id, visibility FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id === payload.user_id) {
        return new BadException('You are the owner of this community');
      }

      const existing = await db.oneOrNone(CommunitiesQuery.getMemberStatus, [
        payload.community_id,
        payload.user_id,
      ]);
      if (existing) {
        if (existing.status === 'accepted') return new BadException('You are already a member');
        if (existing.status === 'pending') return new BadException('Your request is already pending');
      }

      const memberStatus = community.visibility === 'private' ? 'pending' : 'accepted';
      await db.oneOrNone(CommunitiesQuery.joinCommunity, [
        payload.community_id,
        payload.user_id,
        memberStatus,
      ]);

      if (memberStatus === 'accepted') {
        await db.none(CommunitiesQuery.incrementMembersCount, [payload.community_id]);
      }

      return { status: memberStatus };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async leaveCommunity(
    payload: dtos.LeaveCommunityDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id === payload.user_id) {
        return new BadException('Owner cannot leave their own community');
      }

      const member = await db.oneOrNone(CommunitiesQuery.getMemberStatus, [
        payload.community_id,
        payload.user_id,
      ]);
      if (!member) return new NotFoundException('You are not a member of this community');

      await db.oneOrNone(CommunitiesQuery.leaveCommunity, [payload.community_id, payload.user_id]);

      if (member.status === 'accepted') {
        await db.none(CommunitiesQuery.decrementMembersCount, [payload.community_id]);
      }
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getCommunityMembers(
    payload: dtos.GetCommunityMembersQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const community = await db.oneOrNone('SELECT id FROM communities WHERE id = $1', [
        payload.community_id,
      ]);
      if (!community) return new NotFoundException('Community not found');

      const { page = '1', limit = '20', community_id } = payload as {
        page?: string;
        limit?: string;
        community_id: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getCommunityMembers,
        params: [community_id],
      });

      const members = rows.map((row: any) => new entities.CommunityMemberEntity(row));

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        members,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getPendingRequests(
    payload: dtos.GetPendingRequestsQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can view join requests');
      }

      const { page = '1', limit = '20', community_id } = payload as {
        page?: string;
        limit?: string;
        community_id: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getPendingRequests,
        params: [community_id],
      });

      const requests = rows.map((row: any) => new entities.CommunityMemberEntity(row));

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        requests,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async acceptJoinRequest(
    payload: dtos.ManageJoinRequestDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can accept join requests');
      }

      const updated = await db.oneOrNone(CommunitiesQuery.acceptJoinRequest, [
        payload.community_id,
        payload.target_user_id,
      ]);
      if (!updated) return new NotFoundException('No pending request found for this user');

      await db.none(CommunitiesQuery.incrementMembersCount, [payload.community_id]);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async declineJoinRequest(
    payload: dtos.ManageJoinRequestDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can decline join requests');
      }

      const deleted = await db.oneOrNone(CommunitiesQuery.declineJoinRequest, [
        payload.community_id,
        payload.target_user_id,
      ]);
      if (!deleted) return new NotFoundException('No pending request found for this user');
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async removeMember(
    payload: dtos.RemoveMemberDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can remove members');
      }
      if (payload.target_user_id === payload.user_id) {
        return new BadException('Owner cannot remove themselves');
      }

      const removed = await db.oneOrNone(CommunitiesQuery.removeMember, [
        payload.community_id,
        payload.target_user_id,
      ]);
      if (!removed) return new NotFoundException('User is not a member of this community');

      if (removed.status === 'accepted') {
        await db.none(CommunitiesQuery.decrementMembersCount, [payload.community_id]);
      }
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async banMember(
    payload: dtos.BanMemberDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can ban members');
      }
      if (payload.target_user_id === payload.user_id) {
        return new BadException('Owner cannot ban themselves');
      }

      await db.tx(async (t) => {
        const member = await t.oneOrNone(CommunitiesQuery.removeMember, [
          payload.community_id,
          payload.target_user_id,
        ]);

        await t.oneOrNone(CommunitiesQuery.banMember, [
          payload.community_id,
          payload.target_user_id,
          payload.user_id,
          payload.reason || null,
        ]);

        if (member?.status === 'accepted') {
          await t.none(CommunitiesQuery.decrementMembersCount, [payload.community_id]);
        }
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async removeTestimony(
    payload: dtos.TestimonyActionDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can remove testimonies');
      }

      const removed = await db.oneOrNone(CommunitiesQuery.removeTestimony, [
        payload.testimony_id,
        payload.user_id,
        payload.community_id,
      ]);
      if (!removed) return new NotFoundException('Testimony not found in this community');
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async pinTestimony(
    payload: dtos.TestimonyActionDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can pin testimonies');
      }

      const post = await db.oneOrNone(
        'SELECT id, is_pinned FROM community_posts WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL',
        [payload.testimony_id, payload.community_id]
      );
      if (!post) return new NotFoundException('Testimony not found in this community');

      await db.tx(async (t) => {
        await t.none(CommunitiesQuery.unpinAllTestimonies, [payload.community_id]);
        if (!post.is_pinned) {
          await t.oneOrNone(CommunitiesQuery.pinTestimony, [payload.testimony_id, payload.community_id]);
        }
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async reportCommunity(
    payload: dtos.ReportDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone('SELECT id FROM communities WHERE id = $1', [payload.community_id]);
      if (!community) return new NotFoundException('Community not found');

      await db.oneOrNone(CommunitiesQuery.reportCommunity, [
        payload.community_id,
        payload.user_id,
        payload.reason || null,
      ]);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async reportTestimony(
    payload: dtos.ReportDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone('SELECT id FROM communities WHERE id = $1', [payload.community_id]);
      if (!community) return new NotFoundException('Community not found');

      const post = await db.oneOrNone(
        'SELECT id FROM community_posts WHERE id = $1 AND community_id = $2 AND deleted_at IS NULL',
        [payload.testimony_id, payload.community_id]
      );
      if (!post) return new NotFoundException('Testimony not found in this community');

      await db.oneOrNone(CommunitiesQuery.reportTestimony, [
        payload.community_id,
        payload.user_id,
        payload.testimony_id,
        payload.reason || null,
      ]);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getReportedContent(
    payload: dtos.GetReportedContentQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can review reported content');
      }

      const { page = '1', limit = '20', community_id } = payload as {
        page?: string;
        limit?: string;
        community_id: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getReportedContent,
        params: [community_id],
      });

      const reports = rows.map((row: any) =>
        new entities.CommunityReportEntity({
          ...row,
          reporter: { username: row.reporter_username, avatar: row.reporter_avatar },
        })
      );

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        reports,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async reviewReport(
    payload: dtos.ReviewReportDTO
  ): Promise<BadException | NotFoundException | void> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');
      if (community.owner_id !== payload.user_id) {
        return new BadException('Only the community owner can review reports');
      }

      const updated = await db.oneOrNone(CommunitiesQuery.updateReportStatus, [
        payload.report_id,
        payload.community_id,
        payload.status,
        payload.user_id,
      ]);
      if (!updated) return new NotFoundException('Report not found');
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async createCommunityPost(
    payload: dtos.CreateCommunityPostDTO
  ): Promise<BadException | NotFoundException | entities.CommunityTestimonyEntity> {
    try {
      const community = await db.oneOrNone(
        'SELECT id, owner_id FROM communities WHERE id = $1',
        [payload.community_id]
      );
      if (!community) return new NotFoundException('Community not found');

      const isBanned = await db.oneOrNone(CommunitiesQuery.isBanned, [
        payload.community_id,
        payload.user_id,
      ]);
      if (isBanned?.exists) return new BadException('You are banned from this community');

      const isOwner = community.owner_id === payload.user_id;
      if (!isOwner) {
        const membership = await db.oneOrNone(CommunitiesQuery.getMemberStatus, [
          payload.community_id,
          payload.user_id,
        ]);
        if (!membership || membership.status !== 'accepted') {
          return new BadException('You must be an accepted member to post in this community');
        }
      }

      let postType = 'text';
      if (payload.media_attachments && payload.media_attachments.length > 0) {
        const types = new Set(payload.media_attachments.map((m) => m.type));
        postType = types.size === 1 ? (types.values().next().value as string) : 'mixed';
      }

      const post = await db.one(CommunitiesQuery.createCommunityPost, [
        payload.community_id,
        payload.user_id,
        payload.content || null,
        postType,
        JSON.stringify(payload.media_attachments || []),
      ]);

      const content_segments = payload.content
        ? await parseContentSegments(payload.content)
        : [];

      return new entities.CommunityTestimonyEntity({
        ...post,
        content_segments,
        is_liked: false,
        author: { id: payload.user_id },
        community: { id: payload.community_id },
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getCommunityTestimonies(
    payload: dtos.GetCommunityTestimoniesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const community = await db.oneOrNone('SELECT id FROM communities WHERE id = $1', [
        payload.community_id,
      ]);
      if (!community) return new NotFoundException('Community not found');

      const { page = '1', limit = '20', community_id, user_id } = payload as {
        page?: string;
        limit?: string;
        community_id: string;
        user_id: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getCommunityTestimonies,
        params: [community_id, user_id],
      });

      const testimonies = rows.map((row: any) =>
        new entities.CommunityTestimonyEntity({
          ...row,
          author: {
            id: row.user_id,
            username: row.author_username,
            avatar: row.author_avatar,
            display_name: row.author_display_name,
          },
          community: {
            id: row.community_id,
            name: row.community_name,
            avatar: row.community_avatar,
          },
        })
      );

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        testimonies,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getUserCommunityTestimonies(
    payload: dtos.GetUserCommunityTestimoniesQueryDTO
  ): Promise<BadException | NotFoundException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20', target_user_id, requesting_user_id } = payload as {
        page?: string;
        limit?: string;
        target_user_id: string;
        requesting_user_id: string;
      };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: CommunitiesQuery.getUserCommunityTestimonies,
        params: [target_user_id, requesting_user_id],
      });

      const testimonies = rows.map((row: any) =>
        new entities.CommunityTestimonyEntity({
          ...row,
          author: {
            id: row.user_id,
            username: row.author_username,
            avatar: row.author_avatar,
            display_name: row.author_display_name,
          },
          community: {
            id: row.community_id,
            name: row.community_name,
            avatar: row.community_avatar,
          },
        })
      );

      return {
        total: count,
        currentPage: page,
        totalPages: calcPages(count, limit),
        testimonies,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const CommunitiesRepository = new CommunitiesRepositoryImpl();
export default CommunitiesRepository;
