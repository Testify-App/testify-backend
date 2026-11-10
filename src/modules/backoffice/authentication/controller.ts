import { StatusCodes } from 'http-status-codes';
import * as dtos from './dto';
import { fnRequest } from '../../../shared/types';
import { User } from '../../../shared/interface';
import AuthenticationService from './services';
import logger from '../../../shared/services/logger';
import * as Response from '../shared/lib/api-response';
import {
  BadException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';

export class AuthenticationController {
  public login: fnRequest = async (req, res) => {
    const payload = new dtos.LoginDTO(req.body);
    const response = await AuthenticationService.login(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Login OTP sent successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, response.response_message as string, StatusCodes.OK, {
      id: response.id,
      email: response.email,
      first_name: response.first_name,
    });
  };

  public resendLoginOTP: fnRequest = async (req, res) => {
    const payload = new dtos.ResendLoginOTPDTO(req.body);
    const response = await AuthenticationService.resendLoginOTP(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Login OTP resent successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, response.response_message as string, StatusCodes.OK, {
      id: response.id,
      email: response.email,
      first_name: response.first_name,
    });
  };

  public verifyLoginOTP: fnRequest = async (req, res) => {
    const payload = new dtos.VerifyLoginOTPDTO(req.body);
    const response = await AuthenticationService.verifyLoginOTP(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Login Successful', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'Login Successful', StatusCodes.OK, response);
  };

  public forgotPassword: fnRequest = async (req, res) => {
    const payload = new dtos.ForgotPasswordDTO(req.body);
    const response = await AuthenticationService.forgotPassword(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    logger.info('Password reset OTP sent successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'A password reset code has been sent to your registered email.', StatusCodes.OK, {
      email: response.email,
    });
  };

  public resendForgotPasswordOTP: fnRequest = async (req, res) => {
    const payload = new dtos.ForgotPasswordDTO(req.body);
    const response = await AuthenticationService.resendForgotPasswordOTP(payload);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Password reset OTP resent successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'A new password reset code has been sent to your registered email.', StatusCodes.OK, {
      email: response.email,
    });
  };

  public verifyForgotPasswordOTP: fnRequest = async (req, res) => {
    const payload = new dtos.VerifyForgotPasswordOTPDTO(req.body);
    const response = await AuthenticationService.verifyForgotPasswordOTP(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Password reset OTP verified successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'Verified', StatusCodes.OK, {
      hash_id_key: response.hash_id_key,
    });
  };

  public resetPassword: fnRequest = async (req, res) => {
    const payload = new dtos.ResetPasswordDTO(req.body);
    const response = await AuthenticationService.resetPassword(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Password updated successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'Password updated Successfully', StatusCodes.OK);
  };

  public fetchProfile: fnRequest = async (req, res) => {
    const response = await AuthenticationService.fetchProfile(((req as any).user as User).id);
    if (response instanceof NotFoundException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.NOT_FOUND);
    }
    return Response.success(res, 'Profile fetched successfully.', StatusCodes.OK, response);
  };

  public updateProfile: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.UpdateProfileDTO({ ...req.body, id: user.id });
    const response = await AuthenticationService.updateProfile(payload);
    // 400 invalid phone, 404 admin not found, 409 phone in use.
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, response.code);
    }
    logger.info('Profile updated successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'Profile updated successfully.', StatusCodes.OK, response);
  };

  public changePassword: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.ChangePasswordDTO({ ...req.body, id: user.id, session_id: user.session_id as string });
    const response = await AuthenticationService.changePassword(payload);
    if (response instanceof HttpException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, response.code);
    }
    logger.info('Password changed successfully', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'Password changed successfully.', StatusCodes.OK);
  };

  public logout: fnRequest = async (req, res) => {
    const user = (req as any).user as User;
    const payload = new dtos.LogoutDTO({ id: user.id, session_id: user.session_id as string });
    const response = await AuthenticationService.logout(payload);
    if (response instanceof BadException) {
      logger.error(`${response.message}`, 'backoffice.authentication.controller.ts');
      return Response.error(res, response, StatusCodes.BAD_REQUEST);
    }
    logger.info('Logout Successful', 'backoffice.authentication.controller.ts');
    return Response.success(res, 'Logged out successfully.', StatusCodes.OK);
  };
}

const authenticationController = new AuthenticationController();

export default authenticationController;
