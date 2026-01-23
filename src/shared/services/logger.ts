import Logger from '../../config/logger';
import dayjs from 'dayjs';

export interface LogWrapper {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

export class LoggerImpl implements LogWrapper {
  private readonly logger = new Logger(LoggerImpl.name);
  private readonly dateFormat = dayjs().format('DD-MMM-YYYY h:mm:ss');

  public info(message: string, ...args: any[]) {
    this.logger.log(`${this.dateFormat}: ${message} in ${args[0]}`);
  }

  public error(message: string, ...args: any[]) {
    this.logger.error(`${this.dateFormat}: ${message} in ${args[0]}`);
  }
}

const logger = new LoggerImpl();

export default logger;
