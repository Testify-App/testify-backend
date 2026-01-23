import jwt, { Jwt, JwtPayload,  SignOptions } from 'jsonwebtoken';
import ENV from '../utils/env';
import { SignedData } from '../interface';
import { JwtSignOptions } from '../../config/env';

type jwtPayload = Jwt | JwtPayload | string;

export interface JwtSigningService {
  verify(Token: string): jwtPayload;
  sign(payload: SignedData): jwtPayload;
}
export class JwtSigningServiceImpl implements JwtSigningService {
  private readonly JwtSigned = JwtSignOptions;
  private readonly jwtSecret = ENV.get<string>('JWT_SECRET');

  public verify(Token: string): jwtPayload {
    return jwt.verify(Token, this.jwtSecret);
  }

  public async sign(payload: SignedData,  options?: SignOptions): Promise<string> {
    return jwt.sign(payload, this.jwtSecret, { ...this.JwtSigned, ...options });
  }
}

const jwtSigningService = new JwtSigningServiceImpl();

export default jwtSigningService;
