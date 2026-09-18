import cron from 'node-cron';
import { db } from '../../config/database';
import logger from '../services/logger';
import StoriesQuery from '../../modules/stories/query';
import { deleteAsset } from '../integrations/file.upload';

export const runStoryCleanup = async (): Promise<void> => {
  const expired = await db.manyOrNone(StoriesQuery.deleteExpiredStories);
  await Promise.all(
    expired
      .filter((row: any) => row.media_url || row.thumbnail_url)
      .map((row: any) => deleteAsset(row.media_url || row.thumbnail_url).catch(() => {}))
  );
  if (expired.length > 0) {
    logger.info(`Cleaned up ${expired.length} expired stor${expired.length === 1 ? 'y' : 'ies'}`, 'story-cleanup.job.ts');
  }
};

export const startStoryCleanupJob = (): void => {
  cron.schedule('0 3 * * *', () => {
    runStoryCleanup().catch((error) => logger.error(`Story cleanup failed: ${error.message}`, 'story-cleanup.job.ts'));
  });
};
