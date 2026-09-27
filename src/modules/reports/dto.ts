import { BaseEntity } from '../../shared/utils/base-entity';
import { ReportEntityType, ReportStatus, ReportModeratorAction } from './entities';

export class CreateReportDTO extends BaseEntity<CreateReportDTO> {
  reporter_id: string;
  entity_type: ReportEntityType;
  entity_id: string;
  reason: string;
  details?: string;
}

export class GetReportsQueryDTO extends BaseEntity<GetReportsQueryDTO> {
  status?: ReportStatus;
  entity_type?: ReportEntityType;
  page?: string;
  limit?: string;
}

export class ReviewReportDTO extends BaseEntity<ReviewReportDTO> {
  reviewer_id: string;
  report_id: string;
  status: ReportStatus;
  moderator_action?: ReportModeratorAction;
}
