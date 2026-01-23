// import { NotFoundException } from '../../shared/errors';
// import { db } from '../../config/database';
// import * as authParams from './entities';
// import authQueries from './query';

// export interface AuthRepository {
//   createUser(params: authParams.UserEntity): Promise<void>;
//   getUser(param: string): Promise<authParams.UserEntity | NotFoundException>;
//   verifyUser(email: string): Promise<void>;
// }

// export class AuthRepositoryImpl implements AuthRepository {
//   public async createUser(params: authParams.UserEntity): Promise<void> {
//     return db.tx(async (t) => {
//       const createUser = await t.one(authQueries.createUser, params);
//       params.profile.user_id = createUser.id;

//       const createProfile = await t.none(authQueries.createProfile, params.profile);

//       await t.batch([createUser, createProfile]);
//     });

//   }

//   public async getUser(param: string): Promise<authParams.UserEntity | NotFoundException> {

//     const user = await db.oneOrNone(authQueries.getUser, [param]);

//     if (!user) {
//       return new NotFoundException('User not found');
//     }

//     return new authParams.UserEntity({
//       id: user.id,
//       email: user.email,
//       password: user.password,
//       verified: user.verified,
//       profile: {
//         first_name: user.first_name,
//         last_name: user.last_name
//       }
//     })
//   }

//   public async verifyUser(email: string): Promise<void> {
//     await db.none(authQueries.verifyUser, [email]);
//   }

// }

// const authRepository = new AuthRepositoryImpl();

// export default authRepository;
