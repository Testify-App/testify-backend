import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Router, ROUTE_BASE } from "../routes";
import swaggerRouter from './swagger/routes';
import {
  GlobalErrorCatcherMiddleware,
} from '../shared/middlewares/global-error-catcher.middleware';

const app = express();

/**
 * Every request now arrives from CloudFront, never directly from the user, so
 * the TCP peer address is a CloudFront edge server. Without this, `req.ip` is
 * that edge address and every visitor in the world looks like the same handful
 * of IPs — which silently breaks rate limiting (one shared bucket for
 * everyone) and makes audit logs useless.
 *
 * CloudFront puts the real viewer address in X-Forwarded-For. `1` means trust
 * exactly one proxy hop: CloudFront, and nothing beyond it. Using `true` would
 * trust the whole X-Forwarded-For chain, letting a caller spoof any IP by
 * sending their own header.
 */
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
  exposedHeaders: ['hash-id-key'],
}
app.use(cors(corsOptions));

app.use(express.static('public'));

// Use helmet to secure Express headers
app.use(helmet());
app.disable('x-powered-by');

// Env.get<string>('NODE_ENV') !== 'test' && app.use(limiter);

app.use(ROUTE_BASE.V1_PATH, Router);

// Swagger documentation route
app.use('/docs', swaggerRouter);

app.use(GlobalErrorCatcherMiddleware); // must be last applied middleware to catch globalErrs

export default app;
