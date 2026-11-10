import { StatusCodes } from 'http-status-codes';
import { fnRequest } from '../../../shared/types';
import { calcPages } from '../../../shared/helpers';
import * as Response from '../shared/lib/api-response';
import { toCsv } from '../shared/lib/csv';
import AuditLogService from './repositories';

export class AuditLogController {
  public fetchLogs: fnRequest = async (req, res) => {
    const query = req.query as any;
    const [meta, entries] = await AuditLogService.fetchLogs(query);
    return Response.success(res, 'Audit log fetched successfully.', StatusCodes.OK, {
      entries,
      total: meta.count,
      currentPage: query.page,
      totalPages: calcPages(meta.count, query.limit),
    });
  };

  public filters: fnRequest = async (_req, res) => Response.success(
    res, 'Audit log filters fetched successfully.', StatusCodes.OK, await AuditLogService.filters(),
  );

  public exportLogs: fnRequest = async (req, res) => {
    const [, entries] = await AuditLogService.fetchLogs({ ...(req.query as any), page: '1', limit: 'none' });
    const csv = toCsv(
      ['Timestamp', 'Action', 'Admin', 'Target type', 'Target', 'Reason', 'IP address'],
      entries.map((e) => [
        e.created_at, e.action_label, e.actor?.name ?? 'System', e.target?.type ?? '',
        e.target?.name ?? e.target?.reference ?? '', e.reason ?? '', e.ip ?? '',
      ]),
    );
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename=testify-audit-log.csv');
    return res.send(`﻿${csv}`);
  };
}

const auditLogController = new AuditLogController();

export default auditLogController;
