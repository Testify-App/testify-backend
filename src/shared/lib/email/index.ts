import { BrevoClient } from '@getbrevo/brevo';
import Env from '../../utils/env';
import logger from '../../services/logger';
import { BadException } from '../../lib/errors';
import registerTOTPEmailTemplate from './templates/register.TOTP';
import forgotPasswordEmailTemplate from './templates/forgot.password';

const brevoClient = new BrevoClient({ apiKey: Env.get<string>('BREVO_API_KEY') });

// `MAIL_FROM` is accepted as either a bare address ("noreply@testify.app")
// or a "Name <address>" pair, matching the format previously used with nodemailer.
const parseSender = (mailFrom: string): { name?: string; email: string } => {
  const match = mailFrom.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim() || undefined, email: match[2].trim() };
  }
  return { email: mailFrom.trim() };
};

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (Env.get<string>('NODE_ENV') === 'test') return true;

  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      sender: parseSender(Env.get<string>('MAIL_FROM')),
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    });
    return response.messageId;
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
