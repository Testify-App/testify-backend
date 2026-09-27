import { S3Client } from '@aws-sdk/client-s3';
import Env from '../shared/utils/env';

// No explicit `credentials` — the SDK resolves them itself via the default
// provider chain (env vars, SSO profile, ~/.aws/credentials, IAM role, etc.),
// which correctly handles temporary/STS credentials (session tokens, refresh)
// that a manual { accessKeyId, secretAccessKey } object would not.
export const s3Client = new S3Client({
  region: Env.get<string>('AWS_REGION'),
});

export const S3_BUCKET = (): string => Env.get<string>('AWS_S3_BUCKET');
export const S3_PUBLIC_BASE_URL = (): string => Env.get<string>('AWS_S3_PUBLIC_BASE_URL');
