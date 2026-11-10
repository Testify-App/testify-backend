import { BaseEntity } from '../../../shared/utils/base-entity';

export interface PersonSummary {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar: string | null;
}

export class ReportEntity extends BaseEntity<ReportEntity> {
  id: string;
  entity_type: 'post' | 'comment' | 'user' | 'message';
  entity_id: string;
  reason: string;
  reason_code: string | null;
  reason_label: string;
  severity: number;
  details: string | null;
  status: 'pending' | 'under_review' | 'resolved';
  decision: string | null;
  account_action: string | null;
  resolution_notes: string | null;
  created_at: Date;
  review_started_at: Date | null;
  resolved_at: Date | null;
  reporter: PersonSummary;
  owner: PersonSummary & { moderation_status: string; suspended_until: Date | null };
  moderator: { id: string; name: string } | null;
  content: {
    text: string | null;
    media: { url: string; type?: string; thumbnail_url?: string }[];
    created_at: Date | null;
    hidden: boolean;
    deleted: boolean;
    post_id?: string | null;
  };
};

// Declaration merging: the detail has every ReportEntity field plus the ones below.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReportDetailEntity extends ReportEntity {}
export class ReportDetailEntity extends BaseEntity<ReportDetailEntity> {
  owner_profile: {
    created_at: Date;
    status: string;
    bio: string | null;
    deleted: boolean;
    reports_against: number;
    reports_submitted: number;
    enforcement_actions: number;
    warnings: number;
  };
  reporter_profile: {
    created_at: Date;
    reports_against: number;
    reports_submitted: number;
  };
  engagement: { likes: number | null; comments: number | null; reports: number | null };
  related_reports: {
    id: string; reason: string; reason_label: string; status: string; created_at: Date; reporter_username: string;
  }[];
};
