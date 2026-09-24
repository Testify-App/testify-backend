import winston from 'winston';
import Env from '../shared/utils/env';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * Logging is split by destination, not by preference.
 *
 * On AWS the container's stdout is collected by the Docker awslogs driver and
 * shipped to CloudWatch. Anything written to a file inside the container is
 * invisible there, and is lost entirely when the container is replaced — which
 * happens on every deployment. So on a deployed environment logs go to stdout,
 * as JSON, so CloudWatch Logs Insights can query fields rather than regex over
 * text.
 *
 * Locally, human-readable output and the rotating files are more useful, so
 * those are kept for development and test.
 */

const DEPLOYED_ENVS = ['production', 'staging'];

// Human-readable, for a terminal.
const humanFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp } = info;
    return `${timestamp} | ${level}: ${message}`;
  }),
);

// One JSON object per line, for CloudWatch Logs Insights.
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
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

/**
 * An external transport (Sentry, Loki) was once planned here. The assignment
 * was commented out but `new externalTransport()` was left in the production
 * branch, so the application threw `TypeError: externalTransport is not a
 * constructor` at module load and could not start in production at all.
 *
 * The dead variable is removed rather than reinstated. When a real external
 * transport is wanted, add it to the transports array below.
 */
const loggerInfo = (env: string) => {
  if (DEPLOYED_ENVS.includes(env)) {
    return winston.createLogger({
      level: Env.get<string>('LOG_LEVEL') || 'info',
      format: jsonFormat,
      // stdout only. The awslogs driver takes it from here.
      transports: [new winston.transports.Console()],
      exitOnError: false,
    });
  }

  if (env === 'test') {
    return winston.createLogger({
      level: 'info',
      format: humanFormat,
      transports: [
        infoLogRotationTransport,
        errorLogRotationTransport,
        new winston.transports.File({
          filename: 'logs/error.log',
          maxsize: 500,
          format: humanFormat,
        }),
      ],
      exitOnError: false,
    });
  }

  // development, and anything unrecognised
  return winston.createLogger({
    level: 'info',
    format: humanFormat,
    transports: [
      infoLogRotationTransport,
      errorLogRotationTransport,
      new winston.transports.Console(),
    ],
    exitOnError: false,
  });
};

const logger = loggerInfo(Env.get<string>('NODE_ENV'));

export default class Logger {
  constructor(private readonly defaultContext: string) { }
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
