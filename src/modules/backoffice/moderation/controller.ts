import { StatusCodes } from 'http-status-codes';
import { fnRequest } from '../../../shared/types';
import { User } from '../../../shared/interface';
import { calcPages } from '../../../shared/helpers';
import logger from '../../../shared/services/logger';
import * as Response from '../shared/lib/api-response';
import { HttpException, NotFoundException } from '../shared/lib/errors';
import { actorContext } from '../shared/lib/request-context';
import { toCsv } from '../shared/lib/csv';
import * as dtos from './dto';
import ModerationService from './services';

const fail = (res: any, error: HttpException) => {
  logger.error(`${error.message}`, 'moderation.controller.ts');
  return Response.error(res, error, error.code);
};

export class ModerationController {
  public fetchReports: fnRequest = async (req, res) => {
    const payload = new dtos.FetchReportsDTO(req.query as any);
    const [meta, reports] = await ModerationService.fetchReports(payload);
    return Response.success(res, 'Reports fetched successfully.', StatusCodes.OK, {
      reports,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public exportReports: fnRequest = async (req, res) => {
    const payload = new dtos.FetchReportsDTO({ ...(req.query as any), page: '1', limit: 'none' });
    const [, reports] = await ModerationService.fetchReports(payload);
    const csv = toCsv(
      ['Report ID', 'Type', 'Content ID', 'Reason', 'Severity', 'Status', 'Decision', 'Account action',
        'Reporter', 'Content owner', 'Moderator', 'Reported at', 'Resolved at'],
      reports.map((r) => [
        r.id, r.entity_type, r.entity_id, r.reason_label, r.severity, r.status, r.decision ?? '',
        r.account_action ?? '', r.reporter.username ?? '', r.owner.username ?? '', r.moderator?.name ?? '',
        r.created_at, r.resolved_at ?? '',
      ]),
    );
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename=testify-reports.csv');
    return res.send(`﻿${csv}`);
  };

  public fetchReportById: fnRequest = async (req, res) => {
    const response = await ModerationService.fetchReportById(req.params.report_id);
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Report fetched successfully.', StatusCodes.OK, response);
  };

  public startReview: fnRequest = async (req, res) => {
    const response = await ModerationService.startReview(req.params.report_id, actorContext(req));
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Report marked as under review.', StatusCodes.OK, response);
  };

  public resolveReport: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.ResolveReportDTO({ ...req.body, report_id: req.params.report_id });
    const response = await ModerationService.resolveReport(payload, {
      ...actorContext(req), roleId: user.role_id, isRoot: user.is_root_account,
    });
    if (response instanceof HttpException) return fail(res, response);
    logger.info(`Report ${payload.report_id} resolved (${payload.decision})`, 'moderation.controller.ts');
    return Response.success(res, 'Report resolved.', StatusCodes.OK, response);
  };

  public userReports: fnRequest = async (req, res) => {
    const userId = req.params.user_id;
    if (!(await ModerationService.userExists(userId))) {
      return fail(res, new NotFoundException('User not found.'));
    }
    const query = req.query as any;
    const payload = new dtos.FetchReportsDTO({
      page: query.page,
      limit: query.limit,
      ...(query.role === 'reporter' ? { reporter_id: userId } : { owner_id: userId }),
    });
    const [meta, reports] = await ModerationService.fetchReports(payload);
    return Response.success(res, 'Reports fetched successfully.', StatusCodes.OK, {
      reports,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public summary: fnRequest = async (req, res) => {
    const response = await ModerationService.summary(new dtos.SummaryDTO(req.query as any));
    return Response.success(res, 'Summary fetched successfully.', StatusCodes.OK, response);
  };

  public moderators: fnRequest = async (_req, res) => {
    const moderators = await ModerationService.moderators();
    return Response.success(res, 'Moderators fetched successfully.', StatusCodes.OK, { moderators });
  };

  public reasons: fnRequest = async (_req, res) => {
    const reasons = await ModerationService.reasons();
    return Response.success(res, 'Report reasons fetched successfully.', StatusCodes.OK, { reasons });
  };
}

const moderationController = new ModerationController();

export default moderationController;
