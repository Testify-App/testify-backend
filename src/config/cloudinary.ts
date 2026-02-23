import { v2 as cloudinary } from 'cloudinary';
import Env from '../shared/utils/env';

cloudinary.config({
  cloud_name: Env.get<string>('CLOUDINARY_CLOUD_NAME'),
  api_key: Env.get<string>('CLOUDINARY_API_KEY'),
  api_secret: Env.get<string>('CLOUDINARY_API_SECRET'),
});

export default cloudinary;
