import { BaseEntity } from '../../shared/utils/base-entity';

export type CommunityVisibility = 'public' | 'private';
export type CommunityMemberStatus = 'pending' | 'accepted';

export interface CommunityRule {
  text: string;
}

export class CommunityEntity extends BaseEntity<CommunityEntity> {
  id?: string;
  owner_id?: string;
  name?: string;
  description?: string;
  category?: string;
  avatar?: string;
  cover_image?: string;
  visibility?: CommunityVisibility;
  rules?: CommunityRule[];
  members_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export class CommunityWithOwnerEntity extends BaseEntity<CommunityWithOwnerEntity> {
  id?: string;
  owner_id?: string;
  name?: string;
  description?: string;
  category?: string;
  avatar?: string;
  cover_image?: string;
  visibility?: CommunityVisibility;
  rules?: CommunityRule[];
  members_count?: number;
  created_at?: Date;
  updated_at?: Date;
  member_status?: CommunityMemberStatus | null;
  owner?: {
    id?: string;
    username?: string;
    avatar?: string;
    display_name?: string;
  };
}

export class CommunityMemberEntity extends BaseEntity<CommunityMemberEntity> {
  id?: string;
  username?: string;
  avatar?: string;
  display_name?: string;
  status?: CommunityMemberStatus;
  joined_at?: Date;
}

export type CommunityReportEntityType = 'community' | 'testimony';
export type CommunityReportStatus = 'pending' | 'reviewed' | 'dismissed';

export class CommunityBanEntity extends BaseEntity<CommunityBanEntity> {
  id?: string;
  community_id?: string;
  user_id?: string;
  banned_by?: string;
  reason?: string;
  created_at?: Date;
}

export class CommunityTestimonyEntity extends BaseEntity<CommunityTestimonyEntity> {
  id?: string;
  user_id?: string;
  community_id?: string;
  content?: string;
  post_type?: string;
  media_attachments?: Array<{
    type: string;
    url: string;
    thumbnail_url?: string;
    duration?: number;
    size?: number;
    mime_type?: string;
    filename?: string;
    order_index?: number;
  }>;
  is_pinned?: boolean;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  created_at?: Date;
  updated_at?: Date;
  author?: {
    id?: string;
    username?: string;
    avatar?: string;
    display_name?: string;
  };
  community?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
}

export class CommunityReportEntity extends BaseEntity<CommunityReportEntity> {
  id?: string;
  community_id?: string;
  reporter_id?: string;
  entity_type?: CommunityReportEntityType;
  entity_id?: string;
  reason?: string;
  status?: CommunityReportStatus;
  reviewed_by?: string;
  reviewed_at?: Date;
  created_at?: Date;
  reporter?: {
    username?: string;
    avatar?: string;
  };
}
