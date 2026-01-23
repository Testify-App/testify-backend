import Joi from 'joi';
import { AppEnv } from './enums';

export interface EnvProps {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  SWAGGER_ROUTE: string;
  REDIS_SESSION_STORE_URL: string;
  MAIL_USERNAME: string;
  MAIL_PASSWORD: string;
}

export const envValidatorSchema = Joi.object<EnvProps>({
  PORT: Joi.number().default(8000),

  NODE_ENV: Joi.string()
    .required()
    .valid(AppEnv.DEVELOPMENT, AppEnv.TEST, AppEnv.STAGING, AppEnv.PRODUCTION)
    .default(AppEnv.DEVELOPMENT),

  DATABASE_URL: Joi.string().required(),

  REDIS_SESSION_STORE_URL: Joi.string(),

  SWAGGER_ROUTE: Joi.string().default('/api/docs'),

  MAIL_USERNAME: Joi.string(),

  MAIL_PASSWORD: Joi.string(),

}).unknown(true);
