import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, S3_PUBLIC_BASE_URL } from '../../config/s3';
import Env from '../utils/env';

export const deleteAsset = async (url: string): Promise<void> => {
  if (Env.get<string>('NODE_ENV') === 'test') return;

  const baseUrl = S3_PUBLIC_BASE_URL();
  if (!url.startsWith(baseUrl)) return;

  const key = url.slice(baseUrl.length).replace(/^\/+/, '');
  if (!key) return;

  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET(), Key: key }));
};
