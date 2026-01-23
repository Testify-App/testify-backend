import crypto from 'crypto';
import { Response } from 'express';
import * as dtos from './dto';
import * as entities from './entities';
import AuthenticationQuery from './query';
import { db } from '../../config/database';
import { SignedData } from '../../shared/interface';
import { AuthenticationInterface } from './interface';
import otpGenerate from '../../shared/services/token';
import jwtSigningService from '../../shared/services/jwt';
import hashingService from '../../shared/services/hashing';
import {
  BadException,
  NotFoundException,
} from '../../shared/lib/errors';
import { setLastLoginTime } from '../../shared/helpers';

export class AuthenticationRepositoryImpl implements AuthenticationInterface {
  public async register(
    payload: dtos.RegisterDTO,
  ): Promise<BadException | entities.UserEntity> {
    try {
      const response = await db.tx(async (t) => {
        const existingUser = await t.oneOrNone('SELECT id FROM users WHERE email = $1', [payload.email]);
        if (existingUser) {
          throw new BadException('Email already exists');
        }
        const user = await db.one(AuthenticationQuery.register, [
          payload.email,
          payload.password,
          payload.dob,
          payload.username,
          payload.profile_image,
          payload.terms_and_condition,
        ]);
        const otp = await otpGenerate.generateTOTP({ id: user.id, expiresIn: 5 }, 'user', t);
        const data: entities.UserEntity = new entities.UserEntity({
          id: user.id,
          otp: otp,
        });
        return data;
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async activateRegistration(
    payload: dtos.ActivateRegistrationDTO,
  ): Promise<BadException | entities.UserEntity> {
    try {
      const response = await db.tx(async (t) => {
        const user = await t.oneOrNone(AuthenticationQuery.activateRegistration, [payload.id]);
        if (!user) {
          throw new BadException('Invalid user id.');
        }
        const isValid = await otpGenerate.validateTOTP({ id: user.id, token: payload.token }, 'user', t);
        if (!isValid) {
          throw new BadException('Invalid or expired OTP credentials.');
        }
        const signedData: SignedData = {
          id: user.id,
          email: user.email,
        };
        const jwt_token = await jwtSigningService.sign(signedData);
        const data: entities.UserEntity = new entities.UserEntity({
          id: user.id,
          email: user.email,
          token: jwt_token,
          status: user.status,
        });
        return data;
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async usernameAvailability(
    payload: dtos.UsernameAvailabilityDTO,
  ): Promise<BadException | string> {
    const existingUser = await db.oneOrNone('SELECT id FROM users WHERE username = $1', [payload.username]);
    if (existingUser) {
      return new BadException('Username already exists');
    }
    return 'Username available';
  };

  public async forgotPassword(
    payload: dtos.ForgotPasswordDTO
  ): Promise<NotFoundException | entities.UserEntity> {
    try {
      const response = await db.tx(async (t) => {
        const user = await t.oneOrNone('SELECT id FROM users WHERE email = $1', [payload.email]);
        if (!user) {
          throw new NotFoundException('Email does not exist.');
        }
        const otp = await otpGenerate.generateTOTP({ id: user.id, expiresIn: 5 }, 'user', t);
        const data: entities.UserEntity = new entities.UserEntity({
          id: user.id,
          otp: otp,
        });
        return data;
      });
      return response;
    } catch (error) {
      return new NotFoundException(`${error.message}`);
    }
  };

  public async verifyForgotPasswordOTP(
    _res: Response,
    payload: dtos.verifyForgotPasswordOTP
  ): Promise<BadException | entities.UserEntity> {
    try {
      const response = await db.tx(async (t) => {
        const verificationHash = hashingService.generateVerificationHash();
        const user = await t.oneOrNone(`UPDATE users SET hash_id_key = $2 WHERE id = $1 RETURNING id`, [
          payload.id, verificationHash,
        ]);
        if (!user) {
          throw new BadException('Invalid user id.');
        }
        const isValid = await otpGenerate.validateTOTP({ id: user.id, token: payload.token }, 'user', t);
        if (!isValid) {
          throw new BadException('Invalid or expired OTP credentials.');
        }
        const data: entities.UserEntity = new entities.UserEntity({
          id: user.id,
          hash_id_key: verificationHash,
        });
        return data;
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async resetPassword(
    payload: dtos.ResetPasswordDTO
  ): Promise<BadException | entities.UserEntity> {
    try {
      const response = await db.tx(async (t) => {
        const user = await t.oneOrNone(`SELECT hash_id_key FROM users WHERE id = $1`, [payload.id]);
        if (!user) {
          throw new BadException('Invalid user id.');
        }
        if (user.hash_id_key !== payload.hash_id_key) {
          throw new BadException('Invalid or expired hash-id-key.');
        }
        const hashedPassword = await hashingService.hash(payload.new_password);
        await t.none(AuthenticationQuery.resetPassword, [payload.id, hashedPassword]);
        const data: entities.UserEntity = new entities.UserEntity({
          id: payload.id,
        });
        return data;
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };

  public async login(
    payload: dtos.LoginDTO
  ): Promise<BadException | entities.UserEntity> {
    try {
      const response = await db.tx(async (t) => {
        const user = await t.oneOrNone(AuthenticationQuery.login, [payload.email]);
        if (!user) {
          throw new BadException('Invalid login credentials.');
        }
        if (user.status === 'deactivated') {
          throw new BadException('Your account is deactivated. Contact support for assistance.');
        }
        const isValid = await hashingService.compare(payload.password, user.password);
        if (!isValid) {
          throw new BadException('Invalid login credentials.');
        }
        const session_id = crypto.randomBytes(32).toString('hex');
        const setLoginTime = await setLastLoginTime([user.id, session_id], 'user', t);
        const signedData: SignedData = {
          id: user.id,
          email: user.email,
          password: user.password,
        };
        const jwt_token = await jwtSigningService.sign(signedData);
        const data: entities.UserEntity = new entities.UserEntity({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          phone_number: user.phone_number,
          status: user.status,
          token: jwt_token,
        });
        await t.batch([user, setLoginTime]);
        return data;
      });
      return response;
    } catch (error) {
      return new BadException(`${error.message}`);
    }
  };
}

const authenticationRepository = new AuthenticationRepositoryImpl();

export default authenticationRepository;
