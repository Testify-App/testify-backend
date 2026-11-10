import cron from 'node-cron';
import logger from '../services/logger';
import { expireSuspensions } from '../../modules/backoffice/shared/lib/user-standing';

// Expired suspensions stop blocking access the moment they end (see account-standing.ts).
// This job records the reinstatement in the user's history and audit log, and tells the user.
export const startSuspensionExpiryJob = (): void => {
  cron.schedule('*/15 * * * *', () => {
    expireSuspensions()
      .then((count) => {
        if (count > 0) logger.info(`Lifted ${count} expired suspension${count === 1 ? '' : 's'}`, 'suspension-expiry.job.ts');
      })
      .catch((error) => logger.error(`Suspension expiry failed: ${error.message}`, 'suspension-expiry.job.ts'));
  });
};
