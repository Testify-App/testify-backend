import winston from 'winston';
import Env from '../shared/utils/env';
// import * as Sentry from '@sentry/node';
// import LokiTransport from 'winston-loki';
// import Transport from 'winston-transport';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp } = info;
    return `${timestamp} | ${level}: ${message}`;
  })
);

const infoLogRotationTransport = new DailyRotateFile({
  filename: './/logs//info',
  datePattern: 'YYYY-MM-DD-HH:MM',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '80d',
  level: 'info',
  extension: '.log',
});

const errorLogRotationTransport = new DailyRotateFile({
  filename: './/logs//error',
  datePattern: 'YYYY-MM-DD-HH:MM',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '80d',
  level: 'error',
  extension: '.log',
});

let externalTransport: any;
// if (`${Env.get<string>('NODE_ENV')}` === 'production') {
//   externalTransport = Sentry.createSentryWinstonTransport(Transport);
// } else {
//   externalTransport = new LokiTransport({
// 		host: `${Env.get<string>('LOKI_HOST')}`,
// 		labels: { project: 'koins-backend', env: `${Env.get<string>('NODE_ENV')}` },
// 		batching: true,
// 		interval: 5,
// 	});
// }

const loggerInfo = (env: string) => {
  let logger;
  switch (env) {
    case 'production':
      logger = winston.createLogger({
        level: 'info',
        format: logFormat,
        transports: [
          infoLogRotationTransport,
          errorLogRotationTransport,
          new externalTransport(),
        ],
        exitOnError: false,
      });
      break;
    case 'development':
      logger = winston.createLogger({
        level: 'info',
        format: logFormat,
        transports: [
          infoLogRotationTransport,
          errorLogRotationTransport,
          new winston.transports.Console(),
        ],
        exitOnError: false,
      });
      break;
    case 'staging':
      logger = winston.createLogger({
        level: 'info',
        format: logFormat,
        transports: [
          infoLogRotationTransport,
          errorLogRotationTransport,
          externalTransport,
        ],
        exitOnError: false,
      });
      break;
    case 'test':
      logger = winston.createLogger({
        level: 'info',
        format: logFormat,
        transports: [
          infoLogRotationTransport,
          errorLogRotationTransport,
          new winston.transports.File({
            filename: 'logs/error.log',
            maxsize: 500,
            format: logFormat,
          }),
        ],
        exitOnError: false,
      });
      break;
    default:
      logger = winston.createLogger({
        level: 'info',
        format: logFormat,
        transports: [
          infoLogRotationTransport,
          errorLogRotationTransport,
          new winston.transports.Console(),
        ],
        exitOnError: false,
      });
  }

  return logger;
};

const logger = loggerInfo(Env.get<string>('NODE_ENV'));
export default class Logger {
  constructor(private readonly defaultContext: string) {}
  public static log(message: string | any, context?: string): void {
    logger.info(message, { label: context });
  }

  public static error(err: any): void {
    logger.error(err);
  }

  public log(message: string | any, context?: string) {
    logger.info(message, { label: context ?? this.defaultContext });
  }

  public error(err: any): void {
    logger.error(err);
  }
}
