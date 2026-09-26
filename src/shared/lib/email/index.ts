import nodemailer, { Transporter } from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import Env from '../../utils/env';
import logger from '../../services/logger';
import { BadException } from '../../lib/errors';
import registerTOTPEmailTemplate from './templates/register.TOTP';
import forgotPasswordEmailTemplate from './templates/forgot.password';

/**
 * Mail goes out through Amazon SES on AWS, and Gmail SMTP locally.
 *
 * SES is used for two reasons beyond cost. It authenticates with the EC2
 * instance role, so there is no SMTP username and password to store, rotate or
 * leak — the SES SMTP interface would have required exactly that, since its
 * credentials are derived from a long-lived IAM access key. And the domain's
 * DKIM is already signed by SES (`testifyhub.co`, DKIM SUCCESS, custom MAIL
 * FROM `email.testifyhub.co`), which is what keeps verification mail out of
 * spam folders.
 *
 * Local development keeps the previous Gmail SMTP path, because a developer's
 * laptop has no instance role and SES in sandbox cannot mail arbitrary
 * addresses anyway.
 *
 * `MAIL_TRANSPORT` selects: `ses` (default) or `smtp`.
 */

const transportKind = (): 'ses' | 'smtp' =>
  (Env.get<string>('MAIL_TRANSPORT') ?? 'ses').toLowerCase() === 'smtp'
    ? 'smtp'
    : 'ses';

let cached: Transporter | undefined;

const buildTransport = (): Transporter => {
  if (transportKind() === 'smtp') {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: `${Env.get<string>('MAIL_USER')}`,
        pass: `${Env.get<string>('MAIL_APP_PASSWORD')}`,
      },
    });
  }

  /**
   * No credentials are configured. On EC2 the SDK reads the instance role from
   * instance metadata; locally it reads the developer's own `~/.aws`. Adding an
   * accessKeyId here would defeat the point.
   *
   * nodemailer builds an SESv2 request (`Content.Raw`, `FromEmailAddress`), so
   * this must be the v2 client and the v2 command — the v1 `@aws-sdk/client-ses`
   * pair will not work.
   */
  const sesClient = new SESv2Client({
    region:
      Env.get<string>('AWS_SES_REGION') ??
      Env.get<string>('AWS_S3_REGION') ??
      'us-east-1',
  });

  /**
   * Cast because nodemailer's bundled types do not describe the SES option on
   * this overload, even though the transport supports it (see
   * node_modules/nodemailer/lib/ses-transport). The shape is checked against
   * that implementation rather than the types.
   */
  return nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  } as never);
};

/** Built on first use so an unconfigured transport cannot break start-up. */
const transport = (): Transporter => (cached ??= buildTransport());

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (Env.get<string>('NODE_ENV') === 'test') return true;

  try {
    const info = await transport().sendMail({
      from: `${Env.get<string>('MAIL_FROM')}`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(
      `mail sent via ${transportKind()} to ${options.to}: ${info.messageId}`,
      'mailer.ts',
    );
    return info.messageId;
  } catch (error) {
    logger.error(`${error}`, 'mailer.ts');
    throw new BadException(
      `Error occurred while sending email: ${error} | mailer.ts`,
    );
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
