import { BaseEntity } from '../../shared/utils/base-entity';

export type StoryContentType = 'text' | 'image' | 'video';

export class StoryEntity extends BaseEntity<StoryEntity> {
  id?: string;
  user_id?: string;
  content_type?: StoryContentType;
  media_url?: string | null;
  thumbnail_url?: string | null;
  text_content?: string | null;
  background_style?: Record<string, any> | null;
  duration?: number | null;
  views_count?: number;
  is_viewed?: boolean;
  created_at?: Date;
  expires_at?: Date;
  author?: {
    id?: string;
    username?: string;
    avatar?: string;
    display_name?: string;
  };
}

export class StoryViewerEntity extends BaseEntity<StoryViewerEntity> {
  id?: string;
  username?: string;
  avatar?: string;
  display_name?: string;
  viewed_at?: Date;
}
