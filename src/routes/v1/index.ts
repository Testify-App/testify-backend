import express from "express";
import { StatusCodes } from 'http-status-codes';
import * as Response from '../../shared/lib/api-response';
import authenticationRouter from '../../modules/authentication/routes';

const appRouter = express.Router();

appRouter.get('/', (_req, res) =>
  Response.success(res, 'Welcome to Testify API.', StatusCodes.OK)
);

appRouter.get('/healthcheck/ping', (_req, res) =>
  Response.success(res, 'PONG', StatusCodes.OK)
);

appRouter.use("/auth", authenticationRouter);

export const Router = appRouter;
