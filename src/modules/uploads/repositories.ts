import { v4 as uuidv4 } from 'uuid';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import * as dtos from './dto';
import { s3Client, S3_BUCKET, S3_PUBLIC_BASE_URL } from '../../config/s3';
import { UPLOAD_CONTEXT_RULES, extensionForMimeType } from './entities';
import { BadException } from '../../shared/lib/errors';

const PRESIGN_EXPIRY_SECONDS = 60;

export interface PresignedUploadResult {
  url: string;
  fields: Record<string, string>;
  key: string;
  public_url: string;
  expires_in: number;
}

export class UploadsRepositoryImpl {
  public async createPresignedUpload(
    payload: dtos.CreatePresignedUploadDTO
  ): Promise<BadException | PresignedUploadResult> {
    try {
      const rule = UPLOAD_CONTEXT_RULES[payload.context];
      if (!rule) {
        return new BadException('Invalid upload context');
      }

      if (!rule.allowedMimeTypes.includes(payload.content_type)) {
        return new BadException(
          `Unsupported content type for ${payload.context}. Allowed: ${rule.allowedMimeTypes.join(', ')}`
        );
      }

      const extension = extensionForMimeType(payload.content_type);
      if (!extension) {
        return new BadException('Unsupported content type');
      }

      const key = `${rule.keyPrefix}/${payload.user_id}/${uuidv4()}.${extension}`;

      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: S3_BUCKET(),
        Key: key,
        Conditions: [
          ['content-length-range', 0, rule.maxSizeBytes],
          ['eq', '$Content-Type', payload.content_type],
        ],
        Fields: {
          'Content-Type': payload.content_type,
        },
        Expires: PRESIGN_EXPIRY_SECONDS,
      });

      return {
        url,
        fields,
        key,
        public_url: `${S3_PUBLIC_BASE_URL()}/${key}`,
        expires_in: PRESIGN_EXPIRY_SECONDS,
      };
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  }
}

const UploadsRepository = new UploadsRepositoryImpl();
export default UploadsRepository;
