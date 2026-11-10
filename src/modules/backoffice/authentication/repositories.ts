import crypto from 'crypto';
import * as dtos from './dto';
import * as entities from './entities';
import { AuthenticationInterface } from './interface';
import {
  BadException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '../shared/lib/errors';
import { PHONE_IN_USE_MESSAGE, isPhoneUniqueViolation } from '../shared/lib/contact';
import { db } from '../../../config/database';
import AuthenticationQuery from './query';
import { fetchEffectivePermissionKeys } from '../shared/lib/permissions';

export const LOGIN_LOCKED_MESSAGE = 'Your account has been temporarily locked. Please contact your administrator.';

export class AuthenticationRepositoryImpl implements AuthenticationInterface {
  public async login(
    payload: dtos.LoginDTO,
  ): Promise<BadException | entities.AdminEntity> {
    try {
      const admin = await db.oneOrNone(AuthenticationQuery.findAdminByEmail, [payload.email]);
      if (!admin) {
        return new BadException('Login Failed (invalid credentials)');
      }
      if (admin.locked_at) {
        return new BadException(LOGIN_LOCKED_MESSAGE);
      }
      if (admin.status === 'deactivated') {
        return new BadException('Your account has been suspended. Contact your administrator.');
      }
      return new entities.AdminEntity({ ...admin });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  // The query RETURNs the new count, so it must run with db.one (db.none throws on returned rows).
  public async recordFailedLoginAttempt(id: string): Promise<{ failed_login_attempts: number; locked_at: Date | null }> {
    return db.one(AuthenticationQuery.incrementFailedLoginAttempts, [id]);
  };

  public async resetFailedLoginAttempts(id: string): Promise<void> {
    await db.none(AuthenticationQuery.resetFailedLoginAttempts, [id]);
  };

  public async setLoginOTP(id: string, otp: string, expiryTime: Date): Promise<void> {
    await db.none(AuthenticationQuery.setLoginOTP, [id, otp, expiryTime]);
  };

  public async resendLoginOTP(
    payload: dtos.ResendLoginOTPDTO,
  ): Promise<NotFoundException | BadException | entities.AdminEntity> {
    try {
      const admin = await db.oneOrNone(AuthenticationQuery.findAdminById, [payload.id]);
      if (!admin) {
        return new NotFoundException('Admin not found.');
      }
      if (admin.locked_at) {
        return new BadException(LOGIN_LOCKED_MESSAGE);
      }
      return new entities.AdminEntity({ ...admin });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async verifyLoginOTP(
    payload: dtos.VerifyLoginOTPDTO,
  ): Promise<BadException | entities.AdminEntity> {
    try {
      const response = await db.tx(async (t) => {
        const admin = await t.oneOrNone(AuthenticationQuery.findAdminById, [payload.id]);
        if (!admin) {
          throw new BadException('Login Failed (invalid credentials)');
        }
        if (admin.locked_at) {
          throw new BadException(LOGIN_LOCKED_MESSAGE);
        }
        if (admin.status === 'deactivated') {
          throw new BadException('Your account has been suspended. Contact your administrator.');
        }
        if (!admin.otp || !admin.otp_expiry_time) {
          throw new BadException('Verification Failed (try again)');
        }
        const isExpired = new Date(admin.otp_expiry_time).getTime() < Date.now();
        if (isExpired) {
          throw new BadException('Verification Failed (try again)');
        }
        if (admin.otp !== payload.otp) {
          throw new BadException('Verification Failed (try again)');
        }
        await t.none(AuthenticationQuery.clearLoginOTP, [payload.id]);
        const session_id = crypto.randomBytes(32).toString('hex');
        const updated = await t.one(AuthenticationQuery.completeLogin, [payload.id, session_id]);
        await t.none(AuthenticationQuery.createAuditLog, [
          payload.id, 'auth:login', 'authentication', 'admin', payload.id, null, null,
        ]);
        return new entities.AdminEntity({ ...updated });
      });
      return response;
    } catch (error) {
      if (error instanceof BadException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async forgotPassword(
    payload: dtos.ForgotPasswordDTO,
  ): Promise<NotFoundException | entities.AdminEntity> {
    try {
      const admin = await db.oneOrNone(AuthenticationQuery.findAdminByEmail, [payload.email]);
      if (!admin) {
        return new NotFoundException('No account found with this information');
      }
      if (admin.locked_at) {
        return new NotFoundException(LOGIN_LOCKED_MESSAGE);
      }
      if (admin.status === 'deactivated') {
        return new NotFoundException('Your account has been suspended. Contact your administrator.');
      }
      return new entities.AdminEntity({ ...admin });
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async resendForgotPasswordOTP(
    payload: dtos.ForgotPasswordDTO,
  ): Promise<NotFoundException | BadException | entities.AdminEntity> {
    return this.forgotPassword(payload);
  };

  public async setForgotPasswordOTP(id: string, otp: string, expiryTime: Date): Promise<void> {
    await db.none(AuthenticationQuery.setForgotPasswordOTP, [id, otp, expiryTime]);
  };

  public async verifyForgotPasswordOTP(
    payload: dtos.VerifyForgotPasswordOTPDTO,
  ): Promise<BadException | entities.AdminEntity> {
    try {
      const response = await db.tx(async (t) => {
        const admin = await t.oneOrNone(AuthenticationQuery.findAdminByEmail, [payload.email]);
        if (!admin) {
          throw new BadException('Verification Failed (try again)');
        }
        const otpRecord = await t.one(AuthenticationQuery.findForgotPasswordOTP, [admin.id]);
        if (!otpRecord.verification_code || !otpRecord.verification_code_expiry_time) {
          throw new BadException('Verification Failed (try again)');
        }
        const isExpired = new Date(otpRecord.verification_code_expiry_time).getTime() < Date.now();
        if (isExpired) {
          throw new BadException('Verification Failed (try again)');
        }
        if (otpRecord.verification_code !== payload.otp) {
          throw new BadException('Verification Failed (try again)');
        }
        await t.none(AuthenticationQuery.clearForgotPasswordOTP, [admin.id]);
        return new entities.AdminEntity({ ...admin });
      });
      return response;
    } catch (error) {
      if (error instanceof BadException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async resetPassword(
    payload: dtos.ResetPasswordDTO,
  ): Promise<BadException | void> {
    try {
      await db.tx(async (t) => {
        const admin = await t.oneOrNone(AuthenticationQuery.resetPassword, [payload.email, payload.new_password]);
        if (!admin) {
          throw new BadException('Invalid or expired reset request. Please start the reset process again.');
        }
        await t.none(AuthenticationQuery.createAuditLog, [
          admin.id, 'auth:password_reset', 'authentication', 'admin', admin.id, null, null,
        ]);
      });
    } catch (error) {
      if (error instanceof BadException) {
        return error;
      }
      return new BadException(`${error.message}`);
    }
  };

  public async fetchProfile(
    id: string,
  ): Promise<NotFoundException | entities.ProfileEntity> {
    const admin = await db.oneOrNone(AuthenticationQuery.fetchProfile, [id]);
    if (!admin) {
      return new NotFoundException('Admin not found.');
    }
    const { role_id, role_name, role_is_active, role_is_system, ...profile } = admin;
    return new entities.ProfileEntity({
      ...profile,
      role: role_id && role_name
        ? { id: role_id, name: role_name, is_active: role_is_active, is_system: role_is_system }
        : null,
      permissions: await fetchEffectivePermissionKeys(role_id, admin.is_root_account),
    });
  };

  public async findAdminForSelfUpdate(id: string): Promise<{
    id: string; first_name: string | null; last_name: string | null; phone_number: string | null; password: string | null;
  } | null> {
    return db.oneOrNone(AuthenticationQuery.findAdminForSelfUpdate, [id]);
  };

  public async updateProfile(
    payload: dtos.UpdateProfileDTO,
  ): Promise<HttpException | entities.ProfileEntity> {
    try {
      await db.tx(async (t) => {
        const { id, first_name, last_name, phone_number } = payload;
        const current = await t.oneOrNone(AuthenticationQuery.findAdminForSelfUpdate, [id]);
        if (!current) {
          throw new NotFoundException('Admin not found.');
        }
        const updatesPhone = phone_number !== undefined;
        const phone = phone_number ? phone_number : null;
        if (updatesPhone && phone) {
          const holder = await t.oneOrNone(AuthenticationQuery.findAdminByPhone, [phone, id]);
          if (holder) {
            throw new ConflictException(PHONE_IN_USE_MESSAGE);
          }
        }
        await t.none(AuthenticationQuery.updateProfile, [id, first_name, last_name, updatesPhone, phone]);
        await t.none(AuthenticationQuery.createAuditLog, [
          id, 'profile:update', 'authentication', 'admin', id,
          JSON.stringify({
            first_name: current.first_name, last_name: current.last_name,
            ...(updatesPhone ? { phone_number: current.phone_number } : {}),
          }),
          JSON.stringify({ first_name, last_name, ...(updatesPhone ? { phone_number: phone } : {}) }),
        ]);
      });
      return await this.fetchProfile(payload.id);
    } catch (error) {
      if (error instanceof HttpException) {
        return error;
      }
      if (isPhoneUniqueViolation(error)) {
        return new ConflictException(PHONE_IN_USE_MESSAGE);
      }
      return new BadException(`${error.message}`);
    }
  };

  // Saves the new hash and keeps the current portal session.
  public async changePassword(id: string, hashedPassword: string): Promise<BadException | void> {
    try {
      await db.tx(async (t) => {
        await t.none(AuthenticationQuery.changePassword, [id, hashedPassword]);
        await t.none(AuthenticationQuery.createAuditLog, [
          id, 'auth:password_changed', 'authentication', 'admin', id, null, null,
        ]);
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async logout(
    payload: dtos.LogoutDTO,
  ): Promise<BadException | void> {
    try {
      await db.tx(async (t) => {
        await t.none(AuthenticationQuery.endSession, [payload.id, payload.session_id]);
        await t.none(AuthenticationQuery.createAuditLog, [
          payload.id, 'auth:logout', 'authentication', 'admin', payload.id, null, null,
        ]);
      });
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };
}

const authenticationRepository = new AuthenticationRepositoryImpl();

export default authenticationRepository;
