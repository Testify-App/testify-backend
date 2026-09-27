import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import ReportsService from './services';
import { fnRequest } from '../../shared/types';
import { User } from '../../shared/interface';
import * as ResponseBuilder from '../../shared/lib/api-response';
import { BadException, NotFoundException } from '../../shared/lib/errors';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class ReportsController {
  public createReport: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.CreateReportDTO(req.body);
    dto.reporter_id = req.user!.id;

    const response = await ReportsService.createReport(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Content reported successfully', StatusCodes.CREATED, response);
  };

  public getReports: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const query = new dtos.GetReportsQueryDTO(req.query as any);

    const response = await ReportsService.getReports(query);
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Reports retrieved successfully', StatusCodes.OK, response);
  };

  public reviewReport: fnRequest = async (req: AuthenticatedRequest, res: Response) => {
    const dto = new dtos.ReviewReportDTO({
      reviewer_id: req.user!.id,
      report_id: req.params.reportId,
      status: req.body.status,
      moderator_action: req.body.moderator_action,
    });

    const response = await ReportsService.reviewReport(dto);
    if (response instanceof NotFoundException) {
      return ResponseBuilder.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      return ResponseBuilder.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return ResponseBuilder.success(res, 'Report updated successfully', StatusCodes.OK, response);
  };
}

const reportsController = new ReportsController();
export default reportsController;
