import * as dtos from './dto';
import * as entities from './entities';
import ReportsQuery from './query';
import { ReportsInterface } from './interface';
import { db } from '../../config/database';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { calcPages, fetchResourceByPage, FetchPaginatedResponse } from '../../shared/helpers';

function mapToEntity(row: any): entities.ReportEntity {
  const isPost = row.entity_type === 'post';
  return new entities.ReportEntity({
    id: row.id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    content_owner_id: row.content_owner_id,
    reporter_id: row.reporter_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    moderator_action: row.moderator_action,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    reporter: { username: row.reporter_username, avatar: row.reporter_avatar },
    content_owner: {
      id: row.content_owner_id,
      username: row.content_owner_username,
      avatar: row.content_owner_avatar,
    },
    content: isPost
      ? (row.post_id ? {
          id: row.post_id,
          content: row.post_content,
          media_attachments: row.post_media_attachments,
          created_at: row.post_created_at,
        } : null)
      : (row.comment_id ? {
          id: row.comment_id,
          content: row.comment_content,
          media_attachments: row.comment_media_attachments,
          created_at: row.comment_created_at,
        } : null),
  });
}

export class ReportsRepositoryImpl implements ReportsInterface {
  public async createReport(
    payload: dtos.CreateReportDTO
  ): Promise<BadException | NotFoundException | entities.ReportEntity> {
    try {
      const ownerRow = await db.oneOrNone(
        payload.entity_type === 'post' ? ReportsQuery.getPostOwner : ReportsQuery.getCommentOwner,
        [payload.entity_id]
      );
      if (!ownerRow) {
        return new NotFoundException(`${payload.entity_type === 'post' ? 'Post' : 'Comment'} not found`);
      }
      if (ownerRow.user_id === payload.reporter_id) {
        return new BadException('You cannot report your own content');
      }

      const created = await db.oneOrNone(ReportsQuery.createReport, [
        payload.entity_type,
        payload.entity_id,
        ownerRow.user_id,
        payload.reporter_id,
        payload.reason,
        payload.details || null,
      ]);
      if (!created) {
        return new BadException('You have already reported this content');
      }

      if (payload.entity_type === 'post') {
        await db.none('UPDATE posts SET report_count = report_count + 1 WHERE id = $1', [payload.entity_id]);
      }

      return new entities.ReportEntity(created);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }

  public async getReports(
    query: dtos.GetReportsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    try {
      const { page = '1', limit = '20' } = query as { page?: string; limit?: string };

      const [{ count }, rows] = await fetchResourceByPage({
        page,
        limit,
        getResources: ReportsQuery.getReports,
        params: [query.status || null, query.entity_type || null],
      });

      const reports = rows.map((row: any) => mapToEntity(row));

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
  ): Promise<BadException | NotFoundException | entities.ReportEntity> {
    try {
      const updated = await db.oneOrNone(ReportsQuery.updateReportStatus, [
        payload.report_id,
        payload.status,
        payload.moderator_action || null,
        payload.reviewer_id,
      ]);
      if (!updated) {
        return new NotFoundException('Report not found');
      }
      return new entities.ReportEntity(updated);
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const ReportsRepository = new ReportsRepositoryImpl();
export default ReportsRepository;
