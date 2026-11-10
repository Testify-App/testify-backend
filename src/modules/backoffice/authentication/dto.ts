import { BaseEntity } from '../../../shared/utils/base-entity';

export class LoginDTO extends BaseEntity<LoginDTO> {
  email: string;
  password: string;
};

export class ResendLoginOTPDTO extends BaseEntity<ResendLoginOTPDTO> {
  id: string;
};

export class VerifyLoginOTPDTO extends BaseEntity<VerifyLoginOTPDTO> {
  id: string;
  otp: string;
};

export class ForgotPasswordDTO extends BaseEntity<ForgotPasswordDTO> {
  email: string;
};

export class VerifyForgotPasswordOTPDTO extends BaseEntity<VerifyForgotPasswordOTPDTO> {
  email: string;
  otp: string;
};

export class ResetPasswordDTO extends BaseEntity<ResetPasswordDTO> {
  hash_id_key: string;
  new_password: string;
  confirm_new_password: string;
  email?: string;
};

export class LogoutDTO extends BaseEntity<LogoutDTO> {
  id: string;
  session_id: string;
};

export class UpdateProfileDTO extends BaseEntity<UpdateProfileDTO> {
  id: string;
  first_name: string;
  last_name: string;
  // undefined keeps the current number; null clears it.
  phone_number?: string | null;
};

export class ChangePasswordDTO extends BaseEntity<ChangePasswordDTO> {
  id: string;
  session_id: string;
  current_password: string;
  new_password: string;
  confirm_new_password: string;
};
