import express from 'express';
import customerRouter from '../../modules/customers/routes';
import authRouter from '../../modules/authentication/routes';

const appRouter = express.Router();

appRouter.use('/auth', authRouter);
appRouter.use('/customers', customerRouter);

export const Router = appRouter;
