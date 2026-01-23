import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

type FileUpload = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export const fileFilter = function (
  _req: Request,
  file: FileUpload,
  callback: FileFilterCallback,
) {
  const allFileFormats = [
    '.jpeg',
    '.png',
    '.jpg',
    '.pdf',
    '.doc',
    '.docx',
    '.csv',
    '.video/mp4',
    '.mp4',
    '.mkv',
    '.mov',
    '.avi',
    '.webm',
    '.3gp',
    '.3g2',
    '.flv',
    '.wmv',
    '.mpeg',
  ];
  const fileExtCheck = allFileFormats.includes(
    path.extname(file.originalname).toLowerCase(),
  );

  if (fileExtCheck) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

export const upload = multer({
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
});
