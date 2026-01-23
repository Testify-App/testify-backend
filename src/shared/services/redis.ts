import Redis from 'ioredis';
import Env from '../utils/env';

type addToRedisParams = {
  key: string;
  value: any;
  expiresIn?: number;
};

export type redisReturnVal = string | object | number | null | undefined | number[];

export interface RedisService {
  add(params: addToRedisParams): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  get(key: string): Promise<redisReturnVal>;
  incrBy(params: addToRedisParams): Promise<redisReturnVal>;
  redisClient: Redis;
}

export class RedisServiceImpl implements RedisService {
  public readonly redisClient = new Redis(
    Env.get<string>('REDIS_URL'),
    {
      maxRetriesPerRequest: null,
    },  
  );

  public async add(params: addToRedisParams): Promise<boolean> {
    try {
      await this.redisClient.set(params.key, JSON.stringify(params.value));
      if (params.expiresIn)
        this.redisClient.expire(params.key, params.expiresIn);
      return true;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async delete(key: string): Promise<boolean> {
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async get(key: string): Promise<redisReturnVal> {
    try {
      const value = await this.redisClient.get(key);
      if (value) return JSON.parse(value);
      return value;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async incrBy(params: addToRedisParams): Promise<redisReturnVal> {
    try {
      return await this.redisClient.incrby(params.key, params.value);
    } catch (error: any) {
      throw new Error(error);
    }
  }
};

const redisService = new RedisServiceImpl();

export default redisService;