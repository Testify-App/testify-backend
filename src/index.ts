import http from 'http';
import { Express } from 'express';
import app from './config/express';
import Env from './shared/utils/env';
import Logger from './config/logger';
import { db } from './config/database';
import { AppEnv } from './shared/enums';
import { envValidatorSchema } from './shared/env-validator';
import { startStoryCleanupJob } from './shared/jobs/story-cleanup.job';

async function main(app: Express): Promise<void> {
  const logger = new Logger(app.name);

  // run the following before initializing App function
  await Env.validateEnv(envValidatorSchema);

  /**
   * Prove the database is reachable before accepting traffic — and give the
   * connection back.
   *
   * `db.connect()` takes a connection out of the pool and holds it until
   * `done()` is called. That call was missing, so one connection was leaked
   * for the entire life of the process. With the pool now explicitly bounded
   * at 10, that is a tenth of the capacity gone permanently, and it would have
   * been invisible until the pool ran short under load.
   */
  const startupProbe = await db.connect();
  startupProbe.done();

  startStoryCleanupJob();

  const server = http.createServer(app);

  const PORT = Env.get<number>('PORT') || 8080;
  const NODE_ENV = Env.get<string>('NODE_ENV');

  NODE_ENV !== AppEnv.PRODUCTION &&
    server.on('listening', () => {
      logger.log(`Listening on http://localhost:${PORT}`);
      logger.log(`Swagger Documentation: http://localhost:${PORT}/docs`);
    });

  server.listen(PORT);
}

main(app);
