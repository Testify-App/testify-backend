// import hashingService from '../services/hashing/hashing.service';
// import Env from '../../shared/utils/env';
// import redisService, { redisReturnVal } from '../services/redis/redis';
// import { UnAuthorizedException } from '../errors';

// type ParamsType = {
//     action: string;
//     id: string | null;
//     expiry?: number;
//     identifierType: 'hash' | 'otp';
//     value?: string | number;
// };

// export async function generateOtpOrHash(params: ParamsType) {
//     const otpOrHash =
//         params.identifierType === 'hash' ? hashingService.generateVerificationHash() : hashingService.generateTOTP();

//     if (Env.get<string>('NODE_ENV') === 'test' || Env.get<string>('NODE_ENV') == 'development') {
//         process.env.OTP_OR_HASH = otpOrHash;
//     }

//     const id = params.id || otpOrHash;

//     const key = `${id}_${params.action}`;

//     await redisService.delFromRedis(key);

//     await redisService.addToRedis({
//         key: key,
//         value: params.value || otpOrHash,
//         expiresIn: params.expiry
//     });

//     return otpOrHash;
// }

// export async function verifyOtpOrHash(
//     id: string,
//     verificationCode: string,
//     type: 'OTP' | 'hash'
// ): Promise<redisReturnVal | UnAuthorizedException> {
//     const resp = await redisService.getFromRedis(id);

//     if (!resp && type === 'hash') {
//         return new UnAuthorizedException('Invalid or expired hash');
//     }

//     if (type === 'OTP' && resp !== verificationCode) {
//         return new UnAuthorizedException('Invalid or expired OTP');
//     }

//     await redisService.delFromRedis(id);

//     return resp;
// }
