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

/**
 * These read process.env directly rather than through the Env helper.
 *
 * Env.get only exposes keys declared in src/config/env/*.ts, so an undeclared
 * variable silently returns undefined and falls back to its default — which is
 * exactly what happened here first time round: MAIL_CONFIGURATION_SET was set
 * in Parameter Store, read through Env.get, came back undefined, and every send
 * quietly went out with no configuration set at all. Nothing failed; the
 * suppression and metrics simply did not apply.
 *
 * Declaring each one in all four env files would work too, but these are
 * deployment concerns rather than application config, and src/modules/uploads
 * already reads process.env directly for the same reason.
 */
const transportKind = (): 'ses' | 'smtp' =>
  (process.env.MAIL_TRANSPORT ?? 'ses').toLowerCase() === 'smtp'
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
      process.env.AWS_SES_REGION ??
      process.env.AWS_S3_REGION ??
      process.env.AWS_REGION ??
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

/**
 * Naming the configuration set is what makes SES's bounce/complaint
 * suppression and event publishing apply TO THIS MESSAGE. Omit it and the
 * configuration set exists but does nothing: bounces are not suppressed, no
 * metrics are published, and a dead address keeps being mailed until AWS pauses
 * the account.
 *
 * There is no way to set it as an identity default from Terraform, so it has to
 * travel with every send.
 */
const configurationSet = (): string | undefined =>
  process.env.MAIL_CONFIGURATION_SET || undefined;

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  /** Populates the email_type CloudWatch dimension, so bounce rates can be read per mail type. */
  emailType?: string;
}) {
  if (Env.get<string>('NODE_ENV') === 'test') return true;

  const set = configurationSet();

  try {
    const info = await transport().sendMail({
      from: `${Env.get<string>('MAIL_FROM')}`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      /**
       * nodemailer copies the keys of `ses` straight into the SESv2 request,
       * so this is how per-message SES options are passed. Only set when a
       * configuration set is configured, so the SMTP transport is unaffected.
       */
      ...(set
        ? {
            ses: {
              ConfigurationSetName: set,
              EmailTags: [
                {
                  Name: 'email_type',
                  Value: options.emailType ?? 'transactional',
                },
              ],
            },
          }
        : {}),
    } as never);
    logger.info(
      `mail sent via ${transportKind()}${set ? ` [${set}]` : ''} to ${options.to}: ${info.messageId}`,
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
    emailType: 'verification',
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
    emailType: 'password-reset',
  });
};
