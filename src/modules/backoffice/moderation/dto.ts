import { BaseEntity } from '../../../shared/utils/base-entity';

export class FetchReportsDTO extends BaseEntity<FetchReportsDTO> {
  page: string;
  limit: string;
  search?: string;
  status?: 'pending' | 'under_review' | 'resolved';
  reason?: string;
  entity_type?: 'post' | 'comment' | 'user' | 'message';
  from?: string;
  to?: string;
  moderator_id?: string;
  sort?: 'newest' | 'oldest' | 'severity';
  owner_id?: string;
  reporter_id?: string;
};

export class ResolveReportDTO extends BaseEntity<ResolveReportDTO> {
  report_id: string;
  decision: 'no_action' | 'remove_content' | 'account_action';
  account_action?: 'warning' | 'suspend' | 'ban';
  duration_days?: number | null;
  warning_template?: string;
  notes?: string;
  notify: boolean;
};

export class SummaryDTO extends BaseEntity<SummaryDTO> {
  from?: string;
  to?: string;
};
