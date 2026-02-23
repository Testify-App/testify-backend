import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import Env from '../utils/env';
import { File } from '../interface';

export type FileUpload = {
  Bucket?: string;
  Body?: Buffer;
  key: string;
};

export function cloudinaryUpload(publicId: string, fileBuffer: Buffer, mimetype: string) {
  return new Promise((resolve, reject) => {
    console.log('mimetype -> ', mimetype);
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'auto',
        folder: 'testify',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export const UploadFile = async (file: File) => {
  try {
    let publicId = crypto.randomUUID();
    const buffer = Buffer.from(file.buffer);
    const fileName = file.originalname?.split('.')[0] || 'file';
    publicId = `testify/${publicId}-${fileName}`;

    if (Env.get<string>('NODE_ENV') === 'test') {
      return 'https://www.google.com/photos/about/';
    }

    const result = await cloudinaryUpload(publicId, buffer, file.mimetype) as { secure_url: string };
    return result.secure_url;
  } catch (error) {
    throw new Error(`Error uploading file. ${error}`);
  }
};
