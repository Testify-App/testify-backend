"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const env_1 = __importDefault(require("../shared/utils/env"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => {
    const { level, message, timestamp } = info;
    return `${timestamp} | ${level}: ${message}`;
}));
const infoLogRotationTransport = new winston_daily_rotate_file_1.default({
    filename: './/logs//info',
    datePattern: 'YYYY-MM-DD-HH:MM',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '80d',
    level: 'info',
    extension: '.log',
});
const errorLogRotationTransport = new winston_daily_rotate_file_1.default({
    filename: './/logs//error',
    datePattern: 'YYYY-MM-DD-HH:MM',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '80d',
    level: 'error',
    extension: '.log',
});
let externalTransport;
const loggerInfo = (env) => {
    let logger;
    switch (env) {
        case 'production':
            logger = winston_1.default.createLogger({
                level: 'info',
                format: logFormat,
                transports: [
                    infoLogRotationTransport,
                    errorLogRotationTransport,
                    new externalTransport(),
                ],
                exitOnError: false
            });
            break;
        case 'development':
            logger = winston_1.default.createLogger({
                level: 'info',
                format: logFormat,
                transports: [
                    infoLogRotationTransport,
                    errorLogRotationTransport,
                    new winston_1.default.transports.Console(),
                ],
                exitOnError: false,
            });
            break;
        case 'staging':
            logger = winston_1.default.createLogger({
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
            logger = winston_1.default.createLogger({
                level: 'info',
                format: logFormat,
                transports: [
                    infoLogRotationTransport,
                    errorLogRotationTransport,
                    new winston_1.default.transports.File({
                        filename: 'logs/error.log',
                        maxsize: 500,
                        format: logFormat,
                    }),
                ],
                exitOnError: false,
            });
            break;
        default:
            logger = winston_1.default.createLogger({
                level: 'info',
                format: logFormat,
                transports: [
                    infoLogRotationTransport,
                    errorLogRotationTransport,
                    new winston_1.default.transports.Console(),
                ],
                exitOnError: false,
            });
    }
    return logger;
};
const logger = loggerInfo(env_1.default.get('NODE_ENV'));
class Logger {
    constructor(defaultContext) {
        this.defaultContext = defaultContext;
    }
    static log(message, context) {
        logger.info(message, { label: context });
    }
    static error(err) {
        logger.error(err);
    }
    log(message, context) {
        logger.info(message, { label: context !== null && context !== void 0 ? context : this.defaultContext });
    }
    error(err) {
        logger.error(err);
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map