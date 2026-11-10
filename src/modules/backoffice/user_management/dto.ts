import { BaseEntity } from '../../../shared/utils/base-entity';

export class FetchUsersDTO extends BaseEntity<FetchUsersDTO> {
  page: string;
  limit: string;
  search?: string;
  status?: 'active' | 'suspended' | 'banned' | 'restricted';
  flagged?: boolean;
  joined_from?: string;
  joined_to?: string;
  sort?: string;
};

export class FlaggedContentDTO extends BaseEntity<FlaggedContentDTO> {
  user_id: string;
  page: string;
  limit: string;
  sort?: 'recent' | 'severity' | 'reports';
};

export class StandingChangeDTO extends BaseEntity<StandingChangeDTO> {
  user_id: string;
  duration_days?: number | null;
  reason_code?: string | null;
  reason?: string | null;
  note?: string | null;
  notify: boolean;
};

export class NoteDTO extends BaseEntity<NoteDTO> {
  user_id: string;
  note_id?: string;
  body: string;
  tag?: string | null;
};

export class WarningDTO extends BaseEntity<WarningDTO> {
  user_id: string;
  template_key?: string;
  message?: string;
  send_email: boolean;
};
