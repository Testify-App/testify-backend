import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import Env from '../../utils/env';
import { v4 as uuidv4 } from 'uuid';
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken';
import ENV from '../../../shared/utils/env';
import { SignedData } from '../../../shared/interfaces';
import { JwtSignOptions } from '../../../config/env';
type jwtPayload = Jwt | JwtPayload | string;


export interface HashingService {
  hash(data: string, salt?: string): Promise<string>;
  compare(data: string, hash: string): Promise<boolean>;
  genSalt(rounds: number): Promise<string>;
  generateVerificationHash(): string;
  generateTOTP(): string;
  verify(Token: string): jwtPayload;
  sign(payload: SignedData): Promise<string>;
  decode(token: string): any;
}

export class HashingServiceImpl implements HashingService {
  private readonly cryptoSecret: string = Env.get<string>('CRYPTO_SECRET');
  private readonly timeStep: number = Env.get<number>('CRYPTO_TIME_STEP');
  private readonly otpLength: number = Env.get<number>('CRYPTO_OTP_LENGTH');
  private readonly hashAlgorithm: string = Env.get<string>('CRYPTO_HASH_ALGO');
  private readonly saltRound = 10;
  private readonly JwtSigned = JwtSignOptions;
  private readonly jwtSecret = ENV.get<string>('JWT_SECRET');

  public async genSalt(rounds: number): Promise<string> {
    return bcrypt.genSalt(rounds);
  }

  public async hash(
    data: string,
    salt = bcrypt.genSaltSync(this.saltRound),
  ): Promise<string> {
    return bcrypt.hash(data, salt);
  }

  public async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  public generateTOTP(): string {
    const currentTime = Math.floor(Date.now() / 1000);
    const counter = Math.floor(currentTime / this.timeStep);

    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(counter, 4);

    const hmac = crypto.createHmac(this.hashAlgorithm, this.cryptoSecret).update(counterBuffer).digest();

    const offset = hmac[hmac.length - 1] & 0x0f;

    const otpBytes = new Uint8Array(hmac.buffer, hmac.byteOffset + offset, 4);

    const otpValue =
      new DataView(otpBytes.buffer, otpBytes.byteOffset, otpBytes.byteLength).getUint32(0, false) %
      Math.pow(10, this.otpLength);

    return otpValue.toString().padStart(this.otpLength, '0');
  }

  public generateVerificationHash(): string {
    return uuidv4();
  }

  public verify(Token: string): jwtPayload {
    return jwt.verify(Token, this.jwtSecret);
  }

  public async sign(payload: SignedData): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, this.JwtSigned);
  }

  public decode(token: string) {
    return jwt.decode(token);
  }
}

const hashingService: HashingService = new HashingServiceImpl();

export default hashingService;
