import crypto from 'crypto';
import Env from '../utils/env';
import s3 from '../../config/aws';
import { File } from '../interface';

export type FileUpload = {
  Bucket?: string;
  Body?: Buffer;
  key: string;
};

export function s3upload(Key: string, Body: Buffer, mimetype: string) {
  const params = {
    Bucket: `${Env.get<string>('AWS_BUCKET_NAME')}`,
    Key,
    Body,
    ACL: 'public-read',
    ContentType: mimetype,
  };

  if (Env.get<string>('NODE_ENV') === 'test') {
    return { Location: 'https://www.google.com/photos/about/' };
  }
  const upload = s3.upload(params);
  return upload.promise();
};

export const UploadFile = async (file: File) => {
  try {
    let key = crypto.randomUUID();
    key = `files-koins/${key}.${file.originalname}`;
    const buffer = Buffer.from(file.buffer);
    const { Location } = await s3upload(key, buffer, file.mimetype);
    return Location;
  } catch (error) {
    throw new Error(`Error uploading file. ${error}`);
  }
};
