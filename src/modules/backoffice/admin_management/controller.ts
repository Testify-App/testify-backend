import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import AdminManagementService from './services';
import logger from '../../../shared/services/logger';
import * as Response from '../shared/lib/api-response';
import {
  BadException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';
import { fnRequest } from '../../../shared/types';
import { User } from '../../../shared/interface';
import { calcPages } from '../../../shared/helpers';
import { parseBulkInviteCSV } from './csv';
import { previewBulkInvitePayloadValidator } from './validator';

export class AdminManagementController {
  public createRole: fnRequest = async (req, res) => {
    const performedBy = ((req as any).user as User).id;
    const payload = new dtos.CreateRoleDTO({ ...req.body, performed_by: performedBy });
    const response = await AdminManagementService.createRole(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info(`Role ${payload.role_name} created`, 'backoffice.admin_management.controller.ts');
    return Response.success(res, 'Role created successfully.', StatusCodes.CREATED, response);
  };

  public fetchRoles: fnRequest = async (req, res) => {
    const payload = new dtos.FetchRolesDTO(req.query as any);
    const [meta, roles] = await AdminManagementService.fetchRoles(payload);
    return Response.success(res, 'Roles fetched successfully.', StatusCodes.OK, {
      roles,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public fetchRoleById: fnRequest = async (req, res) => {
    const payload = new dtos.FetchRoleByIdDTO(req.params as any);
    const response = await AdminManagementService.fetchRoleById(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    return Response.success(res, 'Role fetched successfully.', StatusCodes.OK, response);
  };

  public editRoleById: fnRequest = async (req, res) => {
    const payload = new dtos.EditRoleDTO({ ...req.params, ...req.body, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.editRoleById(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info(`Role ${payload.role_id} updated`, 'backoffice.admin_management.controller.ts');
    return Response.success(res, 'Role updated successfully.', StatusCodes.OK, response);
  };

  public deleteRoleById: fnRequest = async (req, res) => {
    const payload = new dtos.DeleteRoleDTO({ ...req.params, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.deleteRoleById(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info(`Role ${payload.role_id} deleted`, 'backoffice.admin_management.controller.ts');
    return Response.success(res, 'Role deleted successfully.', StatusCodes.OK);
  };

  public deactivateRoleById: fnRequest = async (req, res) => {
    const payload = new dtos.ToggleRoleStatusDTO({ ...req.params, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.deactivateRoleById(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return Response.success(res, 'Role deactivated successfully.', StatusCodes.OK, response);
  };

  public activateRoleById: fnRequest = async (req, res) => {
    const payload = new dtos.ToggleRoleStatusDTO({ ...req.params, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.activateRoleById(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return Response.success(res, 'Role activated successfully.', StatusCodes.OK, response);
  };

  public fetchPermissions: fnRequest = async (req, res) => {
    const payload = new dtos.FetchPermissionsDTO(req.query as any);
    const [meta, permissions] = await AdminManagementService.fetchPermissions(payload);
    return Response.success(res, 'Permissions fetched successfully.', StatusCodes.OK, {
      permissions,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public reassignRole: fnRequest = async (req, res) => {
    const payload = new dtos.ReassignRoleDTO({ ...req.body, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.reassignRole(payload);
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, response.code);
    }
    return Response.success(res, 'Role reassigned successfully.', StatusCodes.OK, response);
  };

  public fetchStaff: fnRequest = async (req, res) => {
    const payload = new dtos.FetchStaffDTO(req.query as any);
    const [meta, staff] = await AdminManagementService.fetchStaff(payload);
    return Response.success(res, 'Staff fetched successfully.', StatusCodes.OK, {
      staff,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public fetchStaffSummary: fnRequest = async (_req, res) => {
    const response = await AdminManagementService.fetchStaffSummary();
    return Response.success(res, 'Staff summary fetched successfully.', StatusCodes.OK, response);
  };

  public fetchStaffById: fnRequest = async (req, res) => {
    const payload = new dtos.FetchStaffByIdDTO(req.params as any);
    const response = await AdminManagementService.fetchStaffById(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    return Response.success(res, 'Staff member fetched successfully.', StatusCodes.OK, response);
  };

  public editStaff: fnRequest = async (req, res) => {
    const payload = new dtos.EditStaffDTO({ ...req.params, ...req.body, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.editStaff(payload);
    // 400 invalid phone, 403 own role change, 404 staff/role not found, 409 phone in use.
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, response.code);
    }
    return Response.success(res, 'Staff member updated successfully.', StatusCodes.OK, response);
  };

  public suspendStaff: fnRequest = async (req, res) => {
    const payload = new dtos.SuspendStaffDTO({ ...req.params, ...req.body, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.suspendStaff(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return Response.success(res, 'Staff member suspended successfully.', StatusCodes.OK, response);
  };

  public reactivateStaff: fnRequest = async (req, res) => {
    const payload = new dtos.ReactivateStaffDTO({ ...req.params, performed_by: ((req as any).user as User).id });
    const response = await AdminManagementService.reactivateStaff(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return Response.success(res, 'Staff member reactivated successfully.', StatusCodes.OK, response);
  };

  public inviteStaff: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.InviteStaffDTO({
      ...req.body,
      performed_by: user.id,
      performed_by_name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || undefined,
    });
    const response = await AdminManagementService.inviteStaff(payload);
    // 400 email exists / role not found / invalid phone, 409 phone in use.
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, response.code);
    }
    logger.info(`Staff invite sent to ${payload.email}`, 'backoffice.admin_management.controller.ts');
    return Response.success(res, 'Invitation sent successfully.', StatusCodes.CREATED, response);
  };

  // Accepts the CSV itself (Content-Type: text/csv) or rows already parsed by the portal ({ invitees }).
  public previewBulkInvite: fnRequest = async (req, res) => {
    try {
      let rows: dtos.InviteRowDTO[];
      if (typeof req.body === 'string') {
        rows = parseBulkInviteCSV(req.body).map((row) => new dtos.InviteRowDTO(row));
      } else {
        const { value, error } = previewBulkInvitePayloadValidator.validate(req.body ?? {}, {
          messages: { key: '{{key}} ' },
        });
        if (error) {
          return Response.error(res, new BadException(error.details[0].message.replace(/"/g, '')), StatusCodes.UNPROCESSABLE_ENTITY);
        }
        rows = value.invitees.map((row: any) => new dtos.InviteRowDTO(row));
      }
      const payload = new dtos.PreviewBulkInviteDTO({ invitees: rows });
      const response = await AdminManagementService.previewBulkInvite(payload);
      return Response.success(res, 'File parsed successfully.', StatusCodes.OK, {
        rows: response,
        total: response.length,
        valid: response.filter((row) => row.status === 'valid').length,
        invalid: response.filter((row) => row.status === 'invalid').length,
      });
    } catch (error) {
      if (error instanceof BadException) {
        return Response.error(res, error, StatusCodes.BAD_REQUEST);
      }
      return Response.error(res, new BadException('Unable to parse CSV file.'), StatusCodes.BAD_REQUEST);
    }
  };

  public bulkInviteStaff: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.BulkInviteStaffDTO({
      invitees: (req.body.invitees ?? []).map((row: any) => new dtos.InviteRowDTO(row)),
      performed_by: user.id,
      performed_by_name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || undefined,
    });
    const response = await AdminManagementService.bulkInviteStaff(payload);
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, response.code);
    }
    const invited = response.filter((row) => row.status === 'invited').length;
    const failed = response.filter((row) => row.status === 'failed').length;
    const invalid = response.filter((row) => row.status === 'invalid').length;
    logger.info(`Bulk invite completed: ${invited} invited, ${failed} failed, ${invalid} invalid`, 'backoffice.admin_management.controller.ts');
    return Response.success(res, 'Bulk invite operation completed.', StatusCodes.OK, {
      rows: response,
      total: response.length,
      invited,
      failed,
      invalid,
    });
  };

  public downloadBulkInviteTemplate: fnRequest = async (_req, res) => {
    const header = 'first_name,last_name,email,phone_number,role_id\n';
    const example = 'Jane,Doe,jane.doe@example.com,+2348012345678,role-id-here\n';
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename=staff-bulk-invite-template.csv');
    return res.send(header + example);
  };

  public acceptInvite: fnRequest = async (req, res) => {
    const payload = new dtos.AcceptInviteDTO(req.body);
    const response = await AdminManagementService.acceptInvite(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    return Response.success(res, 'Invitation accepted. You may now sign in.', StatusCodes.OK);
  };

  public resendInvite: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.ResendInviteDTO({
      ...req.params,
      performed_by: user.id,
      performed_by_name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || undefined,
    });
    const response = await AdminManagementService.resendInvite(payload);
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, response.code);
    }
    logger.info(`Staff invite resent to ${response.email}`, 'backoffice.admin_management.controller.ts');
    return Response.success(res, 'Invitation resent successfully.', StatusCodes.OK, response);
  };

  public fetchStaffActivity: fnRequest = async (req, res) => {
    const payload = new dtos.FetchStaffActivityDTO({ ...req.params, ...(req.query as any) });
    const response = await AdminManagementService.fetchStaffActivity(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.admin_management.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    const [meta, activities] = response;
    return Response.success(res, 'Staff activity fetched successfully.', StatusCodes.OK, {
      activities,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };
}

const adminManagementController = new AdminManagementController();

export default adminManagementController;
