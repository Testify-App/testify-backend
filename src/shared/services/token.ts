import * as crypto from 'crypto';
import Env from '../utils/env';
import { ITask } from 'pg-promise';
import { db } from '../../config/database';
import AuthenticationQuery from '../../modules/authentication/query';

type generateTOTP = {
  id: string;
  expiresIn: number; // minutes
};

type validateTOTP = {
  id: string;
  token: string;
};

export interface OtpGenerateService {
  generateTOTP(payload: generateTOTP, entity: 'admin' | 'user', t?: ITask<any>): Promise<string>;
  validateTOTP(payload: validateTOTP, entity: 'admin' | 'user', t?: ITask<any>): Promise<boolean>;
};

export class OTPGenerateServiceImpl implements OtpGenerateService {
  private readonly cryptoSecret: string = Env.get<string>('CRYPTO_SECRET');
  private readonly timeStep: number = Env.get<number>('CRYPTO_TIME_STEP');
  private readonly otpLength: number = Env.get<number>('CRYPTO_OTP_LENGTH');
  private readonly hashAlgorithm: string = Env.get<string>('CRYPTO_HASH_ALGO');

  public async generateTOTP(
    payload: generateTOTP,
    entity: 'admin' | 'user',
    t?: ITask<any>,
  ): Promise<string> {
    const currentTime = Math.floor(Date.now() / 1000);
    const counter = Math.floor(currentTime / this.timeStep);

    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(counter, 4);

    const hmac = crypto
      .createHmac(this.hashAlgorithm, this.cryptoSecret)
      .update(counterBuffer)
      .digest();

    const offset = hmac[hmac.length - 1] & 0x0f;

    const otpBytes = new Uint8Array(hmac.buffer, hmac.byteOffset + offset, 4);

    const otpValue =
      new DataView(
        otpBytes.buffer,
        otpBytes.byteOffset,
        otpBytes.byteLength,
      ).getUint32(0, false) % Math.pow(10, this.otpLength);

    const expirationTime = Date.now() + payload.expiresIn * 60 * 1000;
    const otpExpiration = new Date(expirationTime);

    const executor = t ?? db;

    if (entity === 'admin') {
      await executor.none(AuthenticationQuery.customerVerificationCode, [
        payload.id,
        otpValue,
        otpExpiration,
      ]);
      return otpValue.toString().padStart(this.otpLength, '0');
    }

    await executor.none(AuthenticationQuery.customerVerificationCode, [
      payload.id,
      otpValue,
      otpExpiration,
    ]);
    return otpValue.toString().padStart(this.otpLength, '0');
  };

  public async validateTOTP(
    payload: validateTOTP,
    entity: 'admin' | 'user',
    t?: ITask<any>,
  ): Promise<boolean> {
    const executor = t ?? db;
    const result = await executor.one(
      entity === 'admin' ? AuthenticationQuery.validateBackofficeVerificationCode : AuthenticationQuery.validateCustomerVerificationCode,
      [payload.id],
    );
    
    const current_time = new Date().toISOString();
    if (
      result.verification_code_expiry_time !== null &&
      result.verification_code_expiry_time.toISOString() < current_time  // 'Invalid or expired OTP credentials.'
    ) {
      return false;
    }
    if (result.verification_code !== payload.token) {
      return false;
    }
    await executor.none(entity === 'admin' ? AuthenticationQuery.clearBackofficeVerificationCode : AuthenticationQuery.clearCustomerVerificationCode, [payload.id]);
    return true;
  };
};

const otpGenerate = new OTPGenerateServiceImpl();

export default otpGenerate;
