import { Router } from 'express';
import * as authValidator from './validator';
import authenticationController from './controller';
import { WatchAsyncController } from '../../shared/utils/watch-async-controller';
import { validateDataMiddleware } from '../../shared/middlewares/request-validator.middleware';

const authenticationRouter = Router();

authenticationRouter.post(
  '/login',
  validateDataMiddleware(authValidator.loginPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.login)
);

authenticationRouter.post(
  '/register',
  validateDataMiddleware(authValidator.registerPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.register)
);

authenticationRouter.patch(
  '/register/activate',
  validateDataMiddleware(authValidator.activateRegistrationPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.activateRegistration)
);

authenticationRouter.get(
  '/username-availability',
  validateDataMiddleware(authValidator.usernameAvailabilityQueryValidator, 'query'),
  WatchAsyncController(authenticationController.usernameAvailability)
);

authenticationRouter.post(
  '/forgot-password',
  validateDataMiddleware(authValidator.forgotPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.forgotPassword),
);

authenticationRouter.post(
  '/forgot-password/verify',
  validateDataMiddleware(authValidator.verifyForgotPasswordOTPPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.verifyForgotPasswordOTP),
);

authenticationRouter.patch(
  '/forgot-password/reset',
  validateDataMiddleware(authValidator.resetPasswordPayloadValidator, 'body'),
  WatchAsyncController(authenticationController.resetPassword),
);

export default authenticationRouter;
