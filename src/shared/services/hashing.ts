import bcrypt from 'bcrypt';
import Env from '../utils/env';
import { v1 as uuidv1 } from 'uuid';

export interface HashingService {
  hash(data: string, salt?: string): Promise<string>;
  compare(data: string, hash: string): Promise<boolean>;
  generateVerificationHash(): string;
}

export class HashingServiceImpl implements HashingService {
  private readonly saltRound = Env.get<number>('SALT_ROUND');

  public async hash(
    data: string,
    salt = bcrypt.genSaltSync(Number(this.saltRound)),
  ): Promise<string> {
    return bcrypt.hash(data, salt);
  }

  public async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }

  public generateVerificationHash(): string {
    return uuidv1();
  }
}

const hashingService: HashingService = new HashingServiceImpl();

export default hashingService;
