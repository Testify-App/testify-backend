import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Router, ROUTE_BASE } from "../routes";
import swaggerRouter from './swagger/routes';
import {
  GlobalErrorCatcherMiddleware,
} from '../shared/middlewares/global-error-catcher.middleware';

const app = express();
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
