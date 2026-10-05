import Joi from 'joi';
import { AppEnv } from './enums';

export interface EnvProps {
  PORT: number;
  NODE_ENV: string;
  DATABASE_URL: string;
  SWAGGER_ROUTE: string;
  REDIS_SESSION_STORE_URL: string;
  BREVO_API_KEY: string;
  MAIL_FROM: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  AWS_S3_PUBLIC_BASE_URL: string;
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

  /**
   * Optional, NOT required — the provider is chosen at run time by
   * MAIL_TRANSPORT, so demanding a Brevo key would stop the service booting
   * whenever the transport is `ses`. When the transport IS `brevo` and this is
   * missing, src/shared/lib/email throws a named error on the first send
   * rather than taking the whole API down at start-up, which is the same trade
   * made for Firebase credentials.
   */
  BREVO_API_KEY: Joi.string(),

  MAIL_FROM: Joi.string().required(),

  AWS_REGION: Joi.string().required(),

  AWS_S3_BUCKET: Joi.string().required(),

  AWS_S3_PUBLIC_BASE_URL: Joi.string().uri().required(),

}).unknown(true);
