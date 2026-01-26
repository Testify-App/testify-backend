import { Response } from 'express';
import * as dtos from './dto';
import * as entities from './entities';
// import Env from '../../shared/utils/env';
import AuthenticationRepository from './repositories';
import otpGenerate from '../../shared/services/token';
import { AuthenticationInterface } from './interface';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';

export class AuthenticationServiceImpl implements AuthenticationInterface {
  public register = async (
    payload: dtos.RegisterDTO
  ): Promise<BadException | entities.UserEntity> => {
    return await AuthenticationRepository.register(payload);
  };

  public activateRegistration = async (
    payload: dtos.ActivateRegistrationDTO
  ): Promise<BadException | entities.UserEntity> => {
    return await AuthenticationRepository.activateRegistration(payload);
  };

  public usernameAvailability = async (
    payload: dtos.UsernameAvailabilityDTO
  ): Promise<BadException | string> => {
    const response = await AuthenticationRepository.usernameAvailability(payload);
    if (response instanceof BadException) {
      return response;
    }
    return await otpGenerate.generateTOTP({ id: response, expiresIn: 5 }, 'user');
  };

  public async forgotPassword(
    payload: dtos.ForgotPasswordDTO
  ): Promise<NotFoundException | entities.UserEntity> {
    const response = await AuthenticationRepository.forgotPassword(payload);
    if (response instanceof NotFoundException) {
      return response;
    }
    // Env.get<string>('NODE_ENV') !== 'test' && delete response.otp;
    return response;
  };

  public verifyForgotPasswordOTP = async (
    res: Response,
    payload: dtos.verifyForgotPasswordOTP
  ): Promise<BadException | entities.UserEntity> => {
    const response = await AuthenticationRepository.verifyForgotPasswordOTP(
      res,
      payload,
    );
    if (response instanceof BadException) {
      return response;
    }
    res.setHeader('hash-id-key', response.hash_id_key as string);
    return response;
  };

  public resetPassword = async (
    payload: dtos.ResetPasswordDTO
  ): Promise<BadException | entities.UserEntity> => {
    const { new_password, confirm_new_password } = payload;
    if (new_password !== confirm_new_password) {
      return new BadException('Password does not match confirm password field');
    }
    const response = await AuthenticationRepository.resetPassword(payload);
    return response;
  };

  public login = async (
    payload: dtos.LoginDTO
  ): Promise<BadException | entities.UserEntity> => {
    return await AuthenticationRepository.login(payload);
  };
}

const AuthenticationServices = new AuthenticationServiceImpl();

export default AuthenticationServices;
