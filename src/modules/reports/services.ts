import * as dtos from './dto';
import * as entities from './entities';
import ReportsRepository from './repositories';
import { ReportsInterface } from './interface';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export class ReportsServiceImpl implements ReportsInterface {
  public async createReport(
    payload: dtos.CreateReportDTO
  ): Promise<BadException | NotFoundException | entities.ReportEntity> {
    return ReportsRepository.createReport(payload);
  }

  public async getReports(
    query: dtos.GetReportsQueryDTO
  ): Promise<BadException | FetchPaginatedResponse> {
    return ReportsRepository.getReports(query);
  }

  public async reviewReport(
    payload: dtos.ReviewReportDTO
  ): Promise<BadException | NotFoundException | entities.ReportEntity> {
    return ReportsRepository.reviewReport(payload);
  }
}

const ReportsService = new ReportsServiceImpl();
export default ReportsService;
