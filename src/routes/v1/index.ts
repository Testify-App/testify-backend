import express from "express";
import { StatusCodes } from 'http-status-codes';
import * as Response from '../../shared/lib/api-response';
import { db } from '../../config/database';
import Logger from '../../config/logger';
import authenticationRouter from '../../modules/authentication/routes';
import postsRouter from '../../modules/posts/routes';
import profilesRouter from '../../modules/profiles/routes';
import hashtagsRouter from '../../modules/hashtags/routes';
import searchRouter from '../../modules/search/routes';
import guestRouter from '../../modules/guest/routes';
import communitiesRouter from '../../modules/communities/routes';
import notificationsRouter from '../../modules/notifications/routes';
import storiesRouter from '../../modules/stories/routes';
import reportsRouter from '../../modules/reports/routes';
import uploadsRouter from '../../modules/uploads/routes';

const appRouter = express.Router();

appRouter.get('/', (_req, res) =>
  Response.success(res, 'Welcome to Testify API.', StatusCodes.OK)
);

/**
 * Liveness AND readiness. Three things depend on this answer:
 *
 *   - the systemd watchdog on the instance, every 30s — three consecutive
 *     failures restart the container
 *   - the deploy script's health gate — a deployment that never goes healthy
 *     is rolled back
 *   - the CloudWatch/external uptime monitor
 *
 * Previously it returned PONG unconditionally, so it reported healthy even
 * with the database unreachable — which is precisely the failure it exists to
 * catch. It now runs a trivial query.
 *
 * The query is deliberately cheap (`select 1`) and time-limited: the watchdog
 * gives up after 5 seconds, so a slow answer is a failed answer. A short
 * timeout also stops health probes piling up connections when the database is
 * already struggling.
 */
const HEALTHCHECK_TIMEOUT_MS = Number(
  process.env.HEALTHCHECK_TIMEOUT_MS ?? 2000,
);

appRouter.get('/healthcheck/ping', async (_req, res) => {
  const startedAt = Date.now();

  try {
    await Promise.race([
      db.one('select 1 as ok'),
      new Promise((_resolve, reject) =>
        setTimeout(
          () => reject(new Error('database health probe timed out')),
          HEALTHCHECK_TIMEOUT_MS,
        ),
      ),
    ]);

    return Response.success(res, 'PONG', StatusCodes.OK, {
      database: 'ok',
      durationMs: Date.now() - startedAt,
    });
  } catch (err: any) {
    Logger.error(err);
    // 503, not 500: the service is alive but not ready to serve traffic.
    return Response.error(
      res,
      new Error('database unreachable'),
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }
});

appRouter.use("/auth", authenticationRouter);

appRouter.use("/posts", postsRouter);

appRouter.use("/profiles", profilesRouter);

appRouter.use("/hashtags", hashtagsRouter);

appRouter.use("/search", searchRouter);

appRouter.use("/guest", guestRouter);

appRouter.use("/communities", communitiesRouter);

appRouter.use("/notifications", notificationsRouter);

appRouter.use("/stories", storiesRouter);

appRouter.use("/reports", reportsRouter);

appRouter.use("/uploads", uploadsRouter);

export const Router = appRouter;
