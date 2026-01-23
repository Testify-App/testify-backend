import { Request, Response } from 'express';
import { ExpressController } from '../types';
import Env from './env';

export const WatchAsyncController = (fn: ExpressController) => (req: Request, res: Response) => {
  Promise.resolve(fn(req, res)).catch((error) => {
      res.status(500).json({
          status: false,
          message: 'We encountered a problem while processing your request. Please try again',
          errors: Env.get<string>('NODE_ENV') !== 'production' ? error.errors || error.message : null
      });
  });
};