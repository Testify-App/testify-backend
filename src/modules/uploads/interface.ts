import * as dtos from './dto';
import { BadException } from '../../shared/lib/errors';
import { PresignedUploadResult } from './repositories';

export interface UploadsInterface {
  createPresignedUpload(payload: dtos.CreatePresignedUploadDTO): Promise<BadException | PresignedUploadResult>;
}
