import aws from 'aws-sdk';
import Env from '../shared/utils/env';

const s3 = new aws.S3({
  region: Env.get<string>('AWS_S3_BUCKET_REGION'),
  credentials: {
    accessKeyId: Env.get<string>('AWS_ACCESS_KEY_ID'),
    secretAccessKey: Env.get<string>('AWS_SECRET_ACCESS_KEY'),
  },
  signatureVersion: 'v4',
  maxRetries: 3,
});

export default s3;
