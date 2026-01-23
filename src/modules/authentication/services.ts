// import authRepository, { AuthRepository } from './repositories';
// import * as authParams from './entities';
// import { ConflictException, NotFoundException, UnAuthorizedException } from '../../shared/errors';
// // import hashingService, { HashingService } from '../../shared/services/hashing/hashing.service';
// // import { generateOtpOrHash, verifyOtpOrHash } from '../../shared/helpers';

// export interface AuthServices {
//   createUser(params: authParams.UserEntity): Promise<ConflictException | void>;
//   // verifyEmailOTP(email: string, otp: string): Promise<UnAuthorizedException | void>;
//   // validateUser(email: string, password: string): Promise<authParams.UserEntity | UnAuthorizedException>;
// }

// export class AuthServiceImpl implements AuthServices {
//   constructor(
//     private readonly hashingService: HashingService,
//     private readonly authRepository: AuthRepository,
//   ) { }

//   // public async getUser(param: string): Promise<authParams.UserEntity | NotFoundException> {
//   //   return this.authRepository.getUser(param);
//   // }

//   public async createUser(params: authParams.UserEntity): Promise<ConflictException | void> {

//     const resp = await this.getUser(params.email);

//     if (resp instanceof authParams.UserEntity) {
//       // user already exists
//       return new ConflictException('User already exists');
//     }

//     params.password = await this.hashingService.hash(params.password);

//     await this.authRepository.createUser(params);

//     await generateOtpOrHash({
//       action: 'verify_email',
//       id: params.email,
//       expiry: 300,
//       identifierType: 'otp'
//     });

//     // send email
//   }

//   public async verifyEmailOTP(email: string, otp: string): Promise<UnAuthorizedException | void> {
//     const resp = await verifyOtpOrHash(`${email}_verify_email`, otp, 'OTP');

//     if (resp instanceof UnAuthorizedException) {
//       return resp;
//     }

//     return this.authRepository.verifyUser(email);
//   }


//   public async validateUser(email: string, password: string): Promise<authParams.UserEntity | UnAuthorizedException> {

//     const resp = await this.getUser(email);

//     if (resp instanceof NotFoundException) {
//       return new UnAuthorizedException('Incorrect email and password combination');
//     }


//     if (!resp.verified) {
//       return new UnAuthorizedException('Account unverified. Please verify your email');
//     }

//     const passwordMatch = await this.hashingService.compare(password, resp.password);

//     if (!passwordMatch) {
//       return new UnAuthorizedException('Incorrect email and password combination');
//     }

//     return new authParams.UserEntity({
//       id: resp.id,
//       email: resp.email,
//       verified: resp.verified,
//       profile: {
//         first_name: resp.profile.first_name,
//         last_name: resp.profile.last_name
//       }
//     });

//   }
// }

// const AuthServices = new AuthServiceImpl(hashingService, authRepository);

// export default AuthServices;
