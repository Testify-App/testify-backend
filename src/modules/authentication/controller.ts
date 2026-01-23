import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import { fnRequest } from '../../shared/types';
import AuthenticationService from './services';
import logger from '../../shared/services/logger';
import * as Response from '../../shared/lib/api-response';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';

export class AuthenticationController {
  public register: fnRequest = async (req, res) => {
    const payload = new dtos.RegisterDTO(req.body);
    const response = await AuthenticationService.register(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info(`A verification code has been sent to ${payload.email}.`, 'authentication.controller.ts');
    return Response.success(res, `A verification code has been sent to ${payload.email}.`, StatusCodes.CREATED, response);
  };

  public activateRegistration: fnRequest = async (req, res) => {
    const payload = new dtos.ActivateRegistrationDTO(req.body);
    const response = await AuthenticationService.activateRegistration(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Account has been successfully activated.', 'authentication.controller.ts');
    return Response.success(res, 'Account has been successfully activated.', StatusCodes.OK, response);
  };

  public usernameAvailability: fnRequest = async (req, res) => {
    const payload = new dtos.UsernameAvailabilityDTO(req.query);
    const response = await AuthenticationService.usernameAvailability(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info(`Username ${payload.username} is available`, 'authentication.controller.ts');
    return Response.success(res, `Username ${payload.username} is available`, StatusCodes.OK);
  };

  public forgotPassword: fnRequest = async (req, res) => {
    const payload = new dtos.ForgotPasswordDTO(req.body);
    const response = await AuthenticationService.forgotPassword(payload);
    if (response instanceof NotFoundException) {
      logger.error(response.message, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    const message = `A 4-digit OTP code was successfully sent to ${payload.email}`;
    logger.info(`${message}`, 'authentication.controller.ts');
    return Response.success(res, `${message}`, StatusCodes.OK, response);
  };

  public verifyForgotPasswordOTP: fnRequest = async (req, res) => {
    const payload = new dtos.verifyForgotPasswordOTP(req.body);
    const response = await AuthenticationService.verifyForgotPasswordOTP(res, payload);
    if (response instanceof BadException) {
      logger.error(response.message, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Successfully verified forgot password OTP', 'authentication.controller.ts');
    return Response.success(res, 'Successfully verified forgot password OTP.', StatusCodes.OK, { id: response.id });
  };

  public resetPassword: fnRequest = async (req, res) => {
    const payload = new dtos.ResetPasswordDTO(req.body);
    payload.hash_id_key = req.get('hash-id-key') as string;
    const response = await AuthenticationService.resetPassword(payload);
    if (response instanceof BadException) {
      logger.error(response.message, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Successfully reset password', 'authentication.controller.ts');
    return Response.success(res, 'Successfully reset password.', StatusCodes.OK, response);
  };

  public login: fnRequest = async (req, res) => {
    const payload = new dtos.LoginDTO(req.body);
    const response = await AuthenticationService.login(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info(`Successfully logged in.`, 'authentication.controller.ts');
    return Response.success(res, `Successfully logged in.`, StatusCodes.OK, response);
  };
}

const authenticationController = new AuthenticationController();

export default authenticationController;
