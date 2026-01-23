import { Router } from 'express';
import customerController from './controller';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';

const customerRouter = Router();

customerRouter.post(
  '/',
  WatchAsyncController(customerController.createProfile),
);

export default customerRouter;
