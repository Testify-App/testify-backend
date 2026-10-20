import http from 'http';
import { Express } from 'express';
import app from './config/express';
import Env from './shared/utils/env';
import Logger from './config/logger';
import { db } from './config/database';
import { AppEnv } from './shared/enums';
import { envValidatorSchema } from './shared/env-validator';
import { startStoryCleanupJob } from './shared/jobs/story-cleanup.job';
import { startFeedAffinityJob } from './shared/jobs/feed-affinity.job';
import { initMessagingGateway, getMessagingIO } from './shared/sockets/messaging.gateway';

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
  startFeedAffinityJob();

  const server = http.createServer(app);

  initMessagingGateway(server);

  const PORT = Env.get<number>('PORT') || 8080;
  const NODE_ENV = Env.get<string>('NODE_ENV');

  NODE_ENV !== AppEnv.PRODUCTION &&
    server.on('listening', () => {
      logger.log(`Listening on http://localhost:${PORT}`);
      logger.log(`Swagger Documentation: http://localhost:${PORT}/docs`);
    });

  server.listen(PORT);

  installShutdownHandlers(server, logger);
}

/**
 * Shut down on SIGTERM without dropping requests.
 *
 * Every deployment replaces the container: the deploy script sends SIGTERM,
 * waits (`docker stop -t 30`), then SIGKILLs. Node's default SIGTERM
 * behaviour is to exit immediately, so until now every deployment severed
 * whatever requests were in flight — a user mid-signup simply got a dead
 * connection.
 *
 * The sequence here is: stop accepting new connections, let in-flight requests
 * finish, close the database pool, exit.
 *
 * This does NOT make deployments zero-downtime. There is one instance and no
 * load balancer, so there is still a gap between the old container stopping
 * and the new one becoming healthy. It removes the *dropped requests*, not the
 * gap — closing the gap needs a second instance.
 */
function installShutdownHandlers(
  server: http.Server,
  logger: Logger,
): void {
  /**
   * Must be under the deploy script's `docker stop -t 30`, or SIGKILL arrives
   * first and the drain is pointless.
   */
  const FORCE_EXIT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 25_000);

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    // A second signal during drain must not restart the sequence.
    if (shuttingDown) return;
    shuttingDown = true;

    logger.log(`${signal} received — draining`, 'shutdown');

    /**
     * Backstop. If a long-running request or a wedged socket prevents the
     * drain from completing, exit anyway rather than hang until SIGKILL.
     */
    const forceExit = setTimeout(() => {
      logger.error(
        new Error(`drain exceeded ${FORCE_EXIT_MS}ms — exiting anyway`),
      );
      process.exit(1);
    }, FORCE_EXIT_MS);
    forceExit.unref();

    try {
      /**
       * Close Socket.IO FIRST, before server.close().
       *
       * `server.close()` does not resolve until every connection is gone, and a
       * WebSocket connection never ends on its own — a connected client holds
       * it open indefinitely. With the messaging gateway attached, the drain
       * below could therefore never complete, so every deploy would hit the
       * FORCE_EXIT_MS backstop and be killed instead of draining. With
       * `docker stop -t 30` against a 25s backstop, that left five seconds of
       * margin on every deploy.
       *
       * `io.close()` disconnects every client and stops the engine. Clients see
       * a clean close and reconnect to the new container, rather than an abrupt
       * transport error.
       *
       * Resolved defensively: the gateway is optional, and shutdown must work
       * whether or not messaging is initialised.
       */
      const io = getMessagingIO();
      if (io) {
        await new Promise<void>((resolve) => {
          const give_up = setTimeout(resolve, 5_000);
          give_up.unref();
          io.close(() => {
            clearTimeout(give_up);
            resolve();
          });
        });
        logger.log('socket.io closed', 'shutdown');
      }

      // Stop accepting new connections; in-flight requests continue.
      const closed = new Promise<void>((resolve) =>
        server.close(() => resolve()),
      );

      /**
       * Keep-alive sockets have to be swept repeatedly, not once.
       *
       * `server.close()` does not complete until every connection is gone, and
       * an idle keep-alive socket still counts. Calling
       * `closeIdleConnections()` once at the start of the drain does nothing
       * useful: at that moment the sockets are busy serving the very requests
       * being drained. They only become idle as those requests finish, and by
       * then the single call has already happened.
       *
       * Measured with one keep-alive client: a 3s request drained in 3.07s,
       * but shutdown did not complete for a further ~2.4s while the now-idle
       * socket sat waiting for the client's own keep-alive timeout. Sweeping
       * closes each socket as soon as it goes idle. Requests in progress are
       * never interrupted.
       */
      const sweepIdle = setInterval(
        () => server.closeIdleConnections?.(),
        250,
      );
      sweepIdle.unref();

      await closed;
      clearInterval(sweepIdle);

      // Release pooled connections so RDS is not left holding them.
      await db.$pool.end();

      logger.log('drain complete', 'shutdown');
      clearTimeout(forceExit);
      process.exit(0);
    } catch (err: any) {
      logger.error(err);
      clearTimeout(forceExit);
      process.exit(1);
    }
  };

  // SIGTERM: deployments and container stop. SIGINT: Ctrl-C locally.
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main(app);
