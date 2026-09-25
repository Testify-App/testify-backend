import { BaseEntity } from '../../shared/utils/base-entity';

export type ReportEntityType = 'post' | 'comment';
export type ReportStatus = 'pending' | 'under_review' | 'resolved';
export type ReportModeratorAction = 'no_action' | 'content_removed' | 'user_action_taken';

export class ReportEntity extends BaseEntity<ReportEntity> {
  id?: string;
  entity_type?: ReportEntityType;
  entity_id?: string;
  content_owner_id?: string;
  reporter_id?: string;
  reason?: string;
  details?: string | null;
  status?: ReportStatus;
  moderator_action?: ReportModeratorAction;
  reviewed_by?: string | null;
  reviewed_at?: Date | null;
  created_at?: Date;
  reporter?: {
    username?: string;
    avatar?: string;
  };
  content_owner?: {
    id?: string;
    username?: string;
    avatar?: string;
  };
  content?: {
    id?: string;
    content?: string;
    media_attachments?: any;
    created_at?: Date;
  } | null;
}
