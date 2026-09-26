import { BaseEntity } from '../../shared/utils/base-entity';
import { UploadContext } from './entities';

export class CreatePresignedUploadDTO extends BaseEntity<CreatePresignedUploadDTO> {
  user_id: string;
  context: UploadContext;
  content_type: string;
}
