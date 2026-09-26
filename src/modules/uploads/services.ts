import * as dtos from './dto';
import UploadsRepository, { PresignedUploadResult } from './repositories';
import { UploadsInterface } from './interface';
import { BadException } from '../../shared/lib/errors';

export class UploadsServiceImpl implements UploadsInterface {
  public async createPresignedUpload(
    payload: dtos.CreatePresignedUploadDTO
  ): Promise<BadException | PresignedUploadResult> {
    return UploadsRepository.createPresignedUpload(payload);
  }
}

const UploadsService = new UploadsServiceImpl();
export default UploadsService;
