import { BaseEntity } from '../../shared/utils/base-entity';
import { StoryContentType } from './entities';

export class CreateStoryDTO extends BaseEntity<CreateStoryDTO> {
  user_id: string;
  content_type: StoryContentType;
  media_url?: string;
  thumbnail_url?: string;
  text_content?: string;
  background_style?: Record<string, any>;
  duration?: number;
}

export class GetCircleStoriesDTO extends BaseEntity<GetCircleStoriesDTO> {
  user_id: string;
}

export class GetMyStoriesDTO extends BaseEntity<GetMyStoriesDTO> {
  user_id: string;
}

export class GetStoryDTO extends BaseEntity<GetStoryDTO> {
  user_id: string;
  story_id: string;
}

export class DeleteStoryDTO extends BaseEntity<DeleteStoryDTO> {
  user_id: string;
  story_id: string;
}

export class GetStoryViewersDTO extends BaseEntity<GetStoryViewersDTO> {
  user_id: string;
  story_id: string;
  page?: string;
  limit?: string;
}
