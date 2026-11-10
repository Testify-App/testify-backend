import { HttpException } from '../shared/lib/errors';
import { ActorContext } from '../shared/lib/request-context';
import { afterStandingChange } from '../shared/lib/user-standing';
import logger from '../../../shared/services/logger';
import * as dtos from './dto';
import ModerationRepository from './repositories';

export class ModerationServiceImpl {
  public fetchReports = (payload: dtos.FetchReportsDTO) => ModerationRepository.fetchReports(payload);

  public fetchReportById = (reportId: string) => ModerationRepository.fetchReportById(reportId);

  public startReview = (reportId: string, actor: ActorContext) => ModerationRepository.startReview(reportId, actor);

  public resolveReport = async (
    payload: dtos.ResolveReportDTO, actor: ActorContext & { roleId?: string | null; isRoot?: boolean },
  ) => {
    const result = await ModerationRepository.resolveReport(payload, actor);
    if (result instanceof HttpException) return result;
    // After commit: clear cached standing, drop sockets, push and email. Never fails the request.
    for (const effect of result.sideEffects) {
      await afterStandingChange(effect).catch((error) => logger.error(`moderation side effect failed: ${error}`, 'moderation.services.ts'));
    }
    return result.report;
  };

  public summary = (payload: dtos.SummaryDTO) => ModerationRepository.summary(payload);

  public moderators = () => ModerationRepository.moderators();

  public reasons = () => ModerationRepository.reasons();

  public userExists = (userId: string) => ModerationRepository.userExists(userId);
}

const ModerationServices = new ModerationServiceImpl();

export default ModerationServices;
