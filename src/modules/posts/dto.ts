import { BaseEntity } from '../../shared/utils/base-entity';
import { PostVisibility } from './entities';

export class CreatePostDTO extends BaseEntity<CreatePostDTO> {
  user_id: string;
  content?: string;
  visibility?: PostVisibility;
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
  parent_post_id?: string;
  quote_text?: string;
}

export class UpdatePostDTO extends BaseEntity<UpdatePostDTO> {
  user_id: string;
  post_id: string;
  content?: string;
  visibility?: PostVisibility;
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
}

export class CreateCommentDTO extends BaseEntity<CreateCommentDTO> {
  content: string;
  parent_comment_id?: string;
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
}

export class GetPostsQueryDTO extends BaseEntity<GetPostsQueryDTO> {
  user_id: string;
  page?: number;
  limit?: number;
}

export class GetPostQueryDTO extends BaseEntity<GetPostQueryDTO> {
  user_id: string;
  post_id: string;
}

export class DeletePostDTO extends BaseEntity<DeletePostDTO> {
  user_id: string;
  post_id: string;
}

export class GetCommentsQueryDTO extends BaseEntity<GetCommentsQueryDTO> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
}

export class GetLikesQueryDTO extends BaseEntity<GetLikesQueryDTO> {
  page?: number;
  limit?: number;
}

export class GetRepostsQueryDTO extends BaseEntity<GetRepostsQueryDTO> {
  page?: number;
  limit?: number;
}
