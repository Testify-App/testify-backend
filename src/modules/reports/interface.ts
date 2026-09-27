import * as dtos from './dto';
import * as entities from './entities';
import { BadException, NotFoundException } from '../../shared/lib/errors';
import { FetchPaginatedResponse } from '../../shared/helpers';

export interface ReportsInterface {
  createReport(payload: dtos.CreateReportDTO): Promise<BadException | NotFoundException | entities.ReportEntity>;
  getReports(query: dtos.GetReportsQueryDTO): Promise<BadException | FetchPaginatedResponse>;
  reviewReport(payload: dtos.ReviewReportDTO): Promise<BadException | NotFoundException | entities.ReportEntity>;
}
