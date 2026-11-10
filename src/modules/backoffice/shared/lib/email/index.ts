import { sendEmail } from '../../../../../shared/lib/email';
import loginOTPEmailTemplate from './templates/login.otp';
import forgotPasswordEmailTemplate from './templates/forgot.password';
import staffInviteEmailTemplate from './templates/staff.invite';

export async function sendBackofficeLoginOTP(
  email: string,
  otp: string,
  first_name: string,
  expiresIn: number,
) {
  return sendEmail({
    to: email,
    subject: 'Your Testify Admin sign-in code',
    html: loginOTPEmailTemplate({ first_name, otp, expiresIn }),
  });
};

export async function forgotPassword(
  email: string,
  otp: string,
  first_name: string,
  expiresIn: number,
) {
  return sendEmail({
    to: email,
    subject: 'Reset your Testify Admin password',
    html: forgotPasswordEmailTemplate({ first_name, otp, expiresIn }),
  });
};

export async function sendStaffInvite(
  email: string,
  first_name: string,
  role: string,
  invited_by: string,
  link: string,
  expiresInHours: number,
) {
  return sendEmail({
    to: email,
    subject: 'You have been invited to Testify Admin',
    html: staffInviteEmailTemplate({ first_name, role, invited_by, link, expiresInHours }),
  });
};
