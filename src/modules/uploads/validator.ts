import Joi from 'joi';
import { UPLOAD_CONTEXT_RULES } from './entities';

export const createPresignedUploadValidator = Joi.object({
  context: Joi.string().valid(...Object.keys(UPLOAD_CONTEXT_RULES)).required(),
  content_type: Joi.string().required(),
});
