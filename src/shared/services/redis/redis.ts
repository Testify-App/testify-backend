// import Redis from 'ioredis';

// type addToRedisParams = {
//     key: string;
//     value: any;
//     expiresIn?: number;
// };

// export type redisReturnVal = string | object | number | null | undefined;

// export interface RedisService {
//     addToRedis(params: addToRedisParams): Promise<boolean>;
//     delFromRedis(key: string): Promise<boolean>;
//     getFromRedis(key: string): Promise<redisReturnVal>;
// }

// export class RedisServiceImpl implements RedisService {
//     private readonly redisClient = new Redis();

//     public async addToRedis(params: addToRedisParams): Promise<boolean> {
//         try {
//             await this.redisClient.set(params.key, JSON.stringify(params.value));
//             if (params.expiresIn) this.redisClient.expire(params.key, params.expiresIn);
//             return true;
//         } catch (error: any) {
//             throw new Error(error);
//         }
//     }

//     public async delFromRedis(key: string): Promise<boolean> {
//         try {
//             await this.redisClient.del(key);
//             return true;
//         } catch (error: any) {
//             throw new Error(error);
//         }
//     }

//     public async getFromRedis(key: string): Promise<redisReturnVal> {
//         try {
//             const value = await this.redisClient.get(key);
//             if (value) return JSON.parse(value);
//             return value;
//         } catch (error: any) {
//             throw new Error(error);
//         }
//     }
// }
// const redisService = new RedisServiceImpl();
// export default redisService;
