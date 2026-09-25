import express from "express";
import { StatusCodes } from 'http-status-codes';
import * as Response from '../../shared/lib/api-response';
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

const appRouter = express.Router();

appRouter.get('/', (_req, res) =>
  Response.success(res, 'Welcome to Testify API.', StatusCodes.OK)
);

appRouter.get('/healthcheck/ping', (_req, res) =>
  Response.success(res, 'PONG', StatusCodes.OK)
);

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

export const Router = appRouter;
