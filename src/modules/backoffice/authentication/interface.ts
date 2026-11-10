import * as dtos from './dto';
import {
  BadException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';
import * as entities from './entities';

export interface AuthenticationInterface {
  login(payload: dtos.LoginDTO): Promise<BadException | entities.AdminEntity>;
  resendLoginOTP(payload: dtos.ResendLoginOTPDTO): Promise<NotFoundException | BadException | entities.AdminEntity>;
  verifyLoginOTP(payload: dtos.VerifyLoginOTPDTO): Promise<BadException | entities.AdminEntity>;

  forgotPassword(payload: dtos.ForgotPasswordDTO): Promise<NotFoundException | entities.AdminEntity>;
  resendForgotPasswordOTP(payload: dtos.ForgotPasswordDTO): Promise<NotFoundException | BadException | entities.AdminEntity>;
  verifyForgotPasswordOTP(payload: dtos.VerifyForgotPasswordOTPDTO): Promise<BadException | entities.AdminEntity>;
  resetPassword(payload: dtos.ResetPasswordDTO): Promise<BadException | void>;

  fetchProfile(id: string): Promise<NotFoundException | entities.ProfileEntity>;
  updateProfile(payload: dtos.UpdateProfileDTO): Promise<HttpException | entities.ProfileEntity>;
  logout(payload: dtos.LogoutDTO): Promise<BadException | void>;
};
