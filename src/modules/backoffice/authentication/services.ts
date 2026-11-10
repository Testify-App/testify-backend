import crypto from 'crypto';
import * as dtos from './dto';
import * as entities from './entities';
import AuthenticationRepository, { LOGIN_LOCKED_MESSAGE } from './repositories';
import { AuthenticationInterface } from './interface';
import {
  BadException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';
import { resolvePhoneInput, titleCaseName } from '../shared/lib/contact';
import { passwordSchema } from './validator';
import hashingService from '../../../shared/services/hashing';
import jwtSigningService from '../../../shared/services/jwt';
import redisService from '../../../shared/services/redis';
import * as MailService from '../shared/lib/email';
import { db } from '../../../config/database';
import AuthenticationQuery from './query';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const RESET_PASSWORD_HASH_TTL_SECONDS = 10 * 60;

export const CHANGE_PASSWORD_MESSAGES = {
  passwordsDoNotMatch: 'Passwords do not match.',
  currentPasswordIncorrect: 'Current password is incorrect.',
  mustDiffer: 'New password must be different from your current password.',
};

// Same rule as reset password / invite acceptance (passwordSchema), reported as a 400 message.
const newPasswordRuleError = (password: string): string | null => {
  const { error } = passwordSchema
    .extract('password')
    .label('New password')
    .validate(password, { messages: { key: '{{key}} ' } });
  return error ? error.details[0].message.replace(/"/g, '') : null;
};

const generateOTP = (): string => {
  const max = Math.pow(10, OTP_LENGTH);
  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
};

const otpExpiryTime = (): Date => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

const isWithinResendCooldown = (expiryTime?: Date | null): boolean => {
  if (!expiryTime) return false;
  const otpIssuedAt = new Date(expiryTime).getTime() - OTP_EXPIRY_MINUTES * 60 * 1000;
  return Date.now() - otpIssuedAt < OTP_RESEND_COOLDOWN_SECONDS * 1000;
};

export class AuthenticationServiceImpl implements AuthenticationInterface {
  public login = async (
    payload: dtos.LoginDTO
  ): Promise<BadException | entities.AdminEntity> => {
    const admin = await AuthenticationRepository.login(payload);
    if (admin instanceof BadException) {
      return admin;
    }
    // Invited admins have no password until they accept their invitation.
    const doesPasswordMatch = !!admin.password
      && await hashingService.compare(payload.password, admin.password as string);
    if (!doesPasswordMatch) {
      const attempt = await AuthenticationRepository.recordFailedLoginAttempt(admin.id);
      // The 5th consecutive failure locks the account.
      if (attempt.locked_at) return new BadException(LOGIN_LOCKED_MESSAGE);
      return new BadException('Login Failed (invalid credentials)');
    }
    await AuthenticationRepository.resetFailedLoginAttempts(admin.id);

    const otp = generateOTP();
    const expiryTime = otpExpiryTime();
    await AuthenticationRepository.setLoginOTP(admin.id, otp, expiryTime);
    await MailService.sendBackofficeLoginOTP(admin.email as string, otp, admin.first_name as string, OTP_EXPIRY_MINUTES);

    delete admin.password;
    admin.response_message = 'A verification code has been sent to your registered email.';
    return admin;
  };

  public resendLoginOTP = async (
    payload: dtos.ResendLoginOTPDTO
  ): Promise<NotFoundException | BadException | entities.AdminEntity> => {
    const admin = await AuthenticationRepository.resendLoginOTP(payload);
    if (admin instanceof NotFoundException || admin instanceof BadException) {
      return admin;
    }

    const current = await db.oneOrNone(AuthenticationQuery.findAdminById, [admin.id]);
    if (isWithinResendCooldown(current?.otp_expiry_time)) {
      return new BadException('Please wait before requesting another code.');
    }

    const otp = generateOTP();
    const expiryTime = otpExpiryTime();
    await AuthenticationRepository.setLoginOTP(admin.id, otp, expiryTime);
    await MailService.sendBackofficeLoginOTP(admin.email as string, otp, admin.first_name as string, OTP_EXPIRY_MINUTES);

    delete admin.password;
    admin.response_message = 'A new verification code has been sent to your registered email.';
    return admin;
  };

  public verifyLoginOTP = async (
    payload: dtos.VerifyLoginOTPDTO
  ): Promise<BadException | entities.AdminEntity> => {
    const admin = await AuthenticationRepository.verifyLoginOTP(payload);
    if (admin instanceof BadException) {
      return admin;
    }
    const signedData = {
      id: admin.id,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
      status: admin.status,
      scope: 'backoffice' as const,
      role_id: admin.role_id,
      is_root_account: admin.is_root_account,
      session_id: admin.session_id,
    };
    admin.jwt_token = await jwtSigningService.sign(signedData);
    admin.response_message = 'Login Successful';
    return admin;
  };

  public forgotPassword = async (
    payload: dtos.ForgotPasswordDTO
  ): Promise<NotFoundException | entities.AdminEntity> => {
    const admin = await AuthenticationRepository.forgotPassword(payload);
    if (admin instanceof NotFoundException) {
      return admin;
    }

    const otp = generateOTP();
    const expiryTime = otpExpiryTime();
    await AuthenticationRepository.setForgotPasswordOTP(admin.id, otp, expiryTime);
    await MailService.forgotPassword(admin.email as string, otp, admin.first_name as string, OTP_EXPIRY_MINUTES);

    delete admin.password;
    return admin;
  };

  public resendForgotPasswordOTP = async (
    payload: dtos.ForgotPasswordDTO
  ): Promise<NotFoundException | BadException | entities.AdminEntity> => {
    const admin = await AuthenticationRepository.forgotPassword(payload);
    if (admin instanceof NotFoundException) {
      return admin;
    }

    const current = await db.oneOrNone(AuthenticationQuery.findForgotPasswordOTP, [admin.id]);
    if (isWithinResendCooldown(current?.verification_code_expiry_time)) {
      return new BadException('Please wait before requesting another code.');
    }

    const otp = generateOTP();
    const expiryTime = otpExpiryTime();
    await AuthenticationRepository.setForgotPasswordOTP(admin.id, otp, expiryTime);
    await MailService.forgotPassword(admin.email as string, otp, admin.first_name as string, OTP_EXPIRY_MINUTES);

    delete admin.password;
    return admin;
  };

  public verifyForgotPasswordOTP = async (
    payload: dtos.VerifyForgotPasswordOTPDTO
  ): Promise<BadException | entities.AdminEntity> => {
    const admin = await AuthenticationRepository.verifyForgotPasswordOTP(payload);
    if (admin instanceof BadException) {
      return admin;
    }
    const hash_id_key = hashingService.generateVerificationHash();
    await redisService.add({
      key: hash_id_key,
      value: payload.email,
      expiresIn: RESET_PASSWORD_HASH_TTL_SECONDS,
    });
    admin.hash_id_key = hash_id_key;
    return admin;
  };

  public resetPassword = async (
    payload: dtos.ResetPasswordDTO
  ): Promise<BadException | void> => {
    const { new_password, confirm_new_password, hash_id_key } = payload;
    if (new_password !== confirm_new_password) {
      return new BadException('Password does not match confirm password field');
    }
    const email = await redisService.get(hash_id_key);
    if (!email) {
      return new BadException('Invalid or expired reset request. Please start the reset process again.');
    }
    payload.email = email as string;
    payload.new_password = await hashingService.hash(new_password);
    const response = await AuthenticationRepository.resetPassword(payload);
    if (response instanceof BadException) {
      return response;
    }
    await redisService.delete(hash_id_key);
  };

  public fetchProfile = async (
    id: string
  ): Promise<NotFoundException | entities.ProfileEntity> => {
    return await AuthenticationRepository.fetchProfile(id);
  };

  public updateProfile = async (
    payload: dtos.UpdateProfileDTO
  ): Promise<HttpException | entities.ProfileEntity> => {
    const phone = resolvePhoneInput(payload.phone_number);
    if (phone.error) {
      return new BadException(phone.error);
    }
    return await AuthenticationRepository.updateProfile(new dtos.UpdateProfileDTO({
      id: payload.id,
      first_name: titleCaseName(payload.first_name),
      last_name: titleCaseName(payload.last_name),
      phone_number: phone.provided ? phone.value : undefined,
    }));
  };

  // Deliberately does not touch failed_login_attempts / locked_at: lockout is a login-only concern.
  public changePassword = async (
    payload: dtos.ChangePasswordDTO
  ): Promise<HttpException | void> => {
    const { id, current_password, new_password, confirm_new_password } = payload;
    if (new_password !== confirm_new_password) {
      return new BadException(CHANGE_PASSWORD_MESSAGES.passwordsDoNotMatch);
    }
    const ruleError = newPasswordRuleError(new_password);
    if (ruleError) {
      return new BadException(ruleError);
    }
    const admin = await AuthenticationRepository.findAdminForSelfUpdate(id);
    if (!admin) {
      return new NotFoundException('Admin not found.');
    }
    if (!admin.password || !(await hashingService.compare(current_password, admin.password))) {
      return new BadException(CHANGE_PASSWORD_MESSAGES.currentPasswordIncorrect);
    }
    if (new_password === current_password) {
      return new BadException(CHANGE_PASSWORD_MESSAGES.mustDiffer);
    }
    return await AuthenticationRepository.changePassword(id, await hashingService.hash(new_password));
  };

  public logout = async (
    payload: dtos.LogoutDTO
  ): Promise<BadException | void> => {
    return await AuthenticationRepository.logout(payload);
  };
}

const AuthenticationServices = new AuthenticationServiceImpl();

export default AuthenticationServices;
