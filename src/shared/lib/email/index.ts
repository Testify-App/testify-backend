import nodemailer from 'nodemailer';
import Env from '../../utils/env';
import logger from '../../services/logger';
import { BadException } from '../../lib/errors';
import registerTOTPEmailTemplate from './templates/register.TOTP';
import forgotPasswordEmailTemplate from './templates/forgot.password';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: `${Env.get<string>('MAIL_USER')}`,
    pass: `${Env.get<string>('MAIL_APP_PASSWORD')}`,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (Env.get<string>('NODE_ENV') === 'test') return true;

  try {
    const info = await transporter.sendMail({
      from: `${Env.get<string>('MAIL_FROM')}`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return info.messageId;
  } catch (error) {
    logger.error(`${error}`, 'mailer.ts');
    throw new BadException(`Error occurred while sending email: ${error} | mailer.ts`);
  }
}

export async function registerTOTP(
  email: string,
  otp: string,
  username: string,
  expiresIn: number,
) {
  const html = registerTOTPEmailTemplate({
    otp,
    username,
    expiresIn,
  });

  return sendEmail({
    to: email,
    subject: 'Activate Your Account.',
    html,
  });
};

export async function forgotPassword(
  email: string,
  otp: string,
  first_name: string,
  expiresIn: number,
) {
  const html = forgotPasswordEmailTemplate({
    otp,
    first_name,
    expiresIn,
  });

  return sendEmail({
    to: email,
    subject: 'Reset Your Password.',
    html,
  });
};
