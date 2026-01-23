import { Response } from 'express';
import * as dtos from './dto';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';
import * as entities from './entities';

export interface AuthenticationInterface {
  register(payload: dtos.RegisterDTO): Promise<BadException | entities.UserEntity>;
  activateRegistration(payload: dtos.ActivateRegistrationDTO): Promise<BadException | entities.UserEntity>;
  usernameAvailability(payload: dtos.UsernameAvailabilityDTO): Promise<BadException | string>;
  forgotPassword(payload: dtos.ForgotPasswordDTO): Promise<NotFoundException | entities.UserEntity>;
  verifyForgotPasswordOTP(res: Response, payload: dtos.verifyForgotPasswordOTP): Promise<BadException | entities.UserEntity>;
  resetPassword(payload: dtos.ResetPasswordDTO): Promise<BadException | entities.UserEntity>;
  login(payload: dtos.LoginDTO): Promise<BadException | entities.UserEntity>;
};
