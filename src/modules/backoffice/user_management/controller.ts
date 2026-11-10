import { StatusCodes } from 'http-status-codes';
import { fnRequest } from '../../../shared/types';
import { User } from '../../../shared/interface';
import { calcPages } from '../../../shared/helpers';
import logger from '../../../shared/services/logger';
import * as Response from '../shared/lib/api-response';
import { HttpException } from '../shared/lib/errors';
import { actorContext } from '../shared/lib/request-context';
import { StandingAction } from '../shared/lib/user-standing';
import * as dtos from './dto';
import UserManagementService from './services';

const fail = (res: any, error: HttpException) => {
  logger.error(`${error.message}`, 'user_management.controller.ts');
  return Response.error(res, error, error.code);
};

const standing = (action: StandingAction, message: string): fnRequest => async (req, res) => {
  const payload = new dtos.StandingChangeDTO({ ...req.body, user_id: req.params.user_id });
  const response = await UserManagementService.changeStanding(action, payload, actorContext(req));
  if (response instanceof HttpException) return fail(res, response);
  return Response.success(res, message, StatusCodes.OK, response);
};

export class UserManagementController {
  public fetchUsers: fnRequest = async (req, res) => {
    const payload = new dtos.FetchUsersDTO(req.query as any);
    const [meta, users] = await UserManagementService.fetchUsers(payload);
    return Response.success(res, 'Users fetched successfully.', StatusCodes.OK, {
      users,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public fetchUserById: fnRequest = async (req, res) => {
    const response = await UserManagementService.fetchUserById(req.params.user_id, actorContext(req));
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'User fetched successfully.', StatusCodes.OK, response);
  };

  public fetchFlaggedContent: fnRequest = async (req, res) => {
    const payload = new dtos.FlaggedContentDTO({ ...(req.query as any), user_id: req.params.user_id });
    const response = await UserManagementService.fetchFlaggedContent(payload);
    if (response instanceof HttpException) return fail(res, response);
    const [meta, items] = response;
    return Response.success(res, 'Flagged content fetched successfully.', StatusCodes.OK, {
      items,
      total: meta.count,
      currentPage: payload.page,
      totalPages: calcPages(meta.count, payload.limit),
    });
  };

  public fetchModerationHistory: fnRequest = async (req, res) => {
    const response = await UserManagementService.fetchModerationHistory(req.params.user_id);
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Moderation history fetched successfully.', StatusCodes.OK, { history: response });
  };

  public suspend = standing('suspend', 'User suspended.');

  public extendSuspension = standing('extend', 'Suspension updated.');

  public ban = standing('ban', 'User banned.');

  public reinstate = standing('reinstate', 'User reinstated.');

  public fetchNotes: fnRequest = async (req, res) => {
    const response = await UserManagementService.fetchNotes(req.params.user_id);
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Notes fetched successfully.', StatusCodes.OK, { notes: response });
  };

  public createNote: fnRequest = async (req, res) => {
    const payload = new dtos.NoteDTO({ ...req.body, user_id: req.params.user_id });
    const response = await UserManagementService.createNote(payload, actorContext(req));
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Note added.', StatusCodes.CREATED, { notes: response });
  };

  public updateNote: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.NoteDTO({ ...req.body, ...req.params });
    const response = await UserManagementService.updateNote(payload, { ...actorContext(req), isRoot: user.is_root_account });
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Note updated.', StatusCodes.OK, { notes: response });
  };

  public deleteNote: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.NoteDTO({ ...req.params, body: '' });
    const response = await UserManagementService.updateNote(payload, { ...actorContext(req), isRoot: user.is_root_account }, true);
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Note deleted.', StatusCodes.OK, { notes: response });
  };

  public warningTemplates: fnRequest = async (_req, res) => Response.success(
    res, 'Warning templates fetched successfully.', StatusCodes.OK, { templates: UserManagementService.warningTemplates() },
  );

  public sendWarning: fnRequest = async (req, res) => {
    const payload = new dtos.WarningDTO({ ...req.body, user_id: req.params.user_id });
    const response = await UserManagementService.sendWarning(payload, actorContext(req));
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Warning sent.', StatusCodes.CREATED, response);
  };

  // ---- App side (signed-in app user) ----------------------------------------------------------

  public pendingWarnings: fnRequest = async (req, res) => {
    const warnings = await UserManagementService.pendingWarnings(((req as any).user as User).id);
    return Response.success(res, 'Pending warnings fetched successfully.', StatusCodes.OK, { warnings });
  };

  public acknowledgeWarning: fnRequest = async (req, res) => {
    const response = await UserManagementService.acknowledgeWarning(((req as any).user as User).id, req.params.warning_id);
    if (response instanceof HttpException) return fail(res, response);
    return Response.success(res, 'Warning acknowledged.', StatusCodes.OK);
  };
}

const userManagementController = new UserManagementController();

export default userManagementController;
