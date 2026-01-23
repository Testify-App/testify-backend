import { BaseEntity } from '../../shared/utils/base-entity';

export class RegisterDTO extends BaseEntity<RegisterDTO> {
  email: string;
  password: string;
  dob: string;
  username: string;
  profile_image: string;
  terms_and_condition: boolean;
};

export class ActivateRegistrationDTO extends BaseEntity<ActivateRegistrationDTO> {
  id: string;
  token: string;
};

export class UsernameAvailabilityDTO extends BaseEntity<UsernameAvailabilityDTO> {
  username: string;
};

export class ForgotPasswordDTO extends BaseEntity<ForgotPasswordDTO> {
  email: string;
};

export class verifyForgotPasswordOTP extends BaseEntity<verifyForgotPasswordOTP> {
  id: string;
  token: string;
};

export class ResetPasswordDTO extends BaseEntity<ResetPasswordDTO> {
  new_password: string;
  confirm_new_password: string;
  id: string;
  hash_id_key: string;
};

export class LoginDTO extends BaseEntity<LoginDTO> {
  email: string;
  password: string;
};
