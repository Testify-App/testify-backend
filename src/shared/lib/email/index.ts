import { BrevoClient } from '@getbrevo/brevo';
import {
  SESv2Client,
  SendEmailCommand,
} from '@aws-sdk/client-sesv2';
import logger from '../../services/logger';
import { BadException } from '../../lib/errors';
import registerTOTPEmailTemplate from './templates/register.TOTP';
import forgotPasswordEmailTemplate from './templates/forgot.password';

/**
 * Transactional mail, with two interchangeable providers.
 *
 * MAIL_TRANSPORT selects which one is used at run time:
 *
 *   brevo  (default)  — Brevo's transactional API
 *   ses               — Amazon SES v2 from the instance role
 *
 * Switching providers is a Parameter Store change plus a redeploy. No code
 * change, no rebuild. Both paths return the provider's message id, so call
 * sites and the functions below are identical either way.
 *
 * WHY BOTH ARE KEPT. SES is verified for testifyhub.co with DKIM and a custom
 * MAIL FROM, but its production access request was declined, so in sandbox it
 * only delivers to verified addresses and the SES simulator. Brevo has no such
 * restriction, which is why it is the default. If SES production access is
 * later granted, flipping MAIL_TRANSPORT back to `ses` costs nothing and
 * removes a third-party dependency — so the SES path is kept working rather
 * than deleted.
 *
 * ENVIRONMENT IS READ FROM process.env DIRECTLY, not through Env.get. Env.get
 * only exposes keys declared in src/config/env/<environment>.ts, so a value
 * present in Parameter Store but not declared there silently reads as
 * undefined. That cost an afternoon once already.
 */

export type MailTransport = 'brevo' | 'ses';

const transport = (): MailTransport =>
  (process.env.MAIL_TRANSPORT || 'brevo').trim().toLowerCase() as MailTransport;

const mailFrom = (): string =>
  process.env.MAIL_FROM || process.env.TESTIFY_MAIL_FROM || '';

/**
 * `MAIL_FROM` is accepted as either a bare address ("noreply@testifyhub.co")
 * or a "Name <address>" pair. SES wants the combined string; Brevo wants the
 * two parts separately, so both forms are derived from one value.
 */
const parseSender = (value: string): { name?: string; email: string } => {
  const match = value.match(/^(.*)<(.+)>$/);
  if (match) {
    return { name: match[1].trim() || undefined, email: match[2].trim() };
  }
  return { email: value.trim() };
};

// ---------------------------------------------------------------------------
// Brevo
// ---------------------------------------------------------------------------

let brevo: BrevoClient | undefined;

/**
 * Built on first use, not at import. The constructor needs BREVO_API_KEY, and
 * building it eagerly would make the whole module throw at import time when
 * the transport is `ses` and no Brevo key is configured at all.
 */
const brevoClient = (): BrevoClient => {
  if (brevo) return brevo;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error(
      'BREVO_API_KEY is not set, but MAIL_TRANSPORT is "brevo". Set it at ' +
        '/testifyhub/prod/app/BREVO_API_KEY, or set MAIL_TRANSPORT to "ses".',
    );
  }

  brevo = new BrevoClient({ apiKey });
  return brevo;
};

const sendViaBrevo = async (to: string, subject: string, html: string) => {
  const response = await brevoClient().transactionalEmails.sendTransacEmail({
    sender: parseSender(mailFrom()),
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
  return response.messageId;
};

// ---------------------------------------------------------------------------
// SES
// ---------------------------------------------------------------------------

let ses: SESv2Client | undefined;

/**
 * NO CREDENTIALS ARE CONFIGURED, deliberately. On EC2 the SDK reads the
 * instance role from instance metadata; locally it reads the developer's own
 * ~/.aws profile. There is no access key to leak, rotate or commit.
 */
const sesClient = (): SESv2Client => {
  if (ses) return ses;
  ses = new SESv2Client({
    region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
  });
  return ses;
};

const sendViaSes = async (to: string, subject: string, html: string) => {
  const result = await sesClient().send(
    new SendEmailCommand({
      FromEmailAddress: mailFrom(),
      Destination: { ToAddresses: [to] },
      /**
       * Naming the configuration set is load-bearing, not decoration. Without
       * it the send succeeds but bounce suppression and event publishing do not
       * apply to the message, so a hard bounce is never recorded and never
       * stops a future send to the same dead address.
       */
      ConfigurationSetName: process.env.MAIL_CONFIGURATION_SET,
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    }),
  );
  return result.MessageId;
};

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.NODE_ENV === 'test' || process.env.TESTIFY_NODE_ENV === 'test') {
    return true;
  }

  const via = transport();

  if (!mailFrom()) {
    throw new BadException(
      'MAIL_FROM is not set. It is supplied from Parameter Store at ' +
        '/testifyhub/prod/app/TESTIFY_MAIL_FROM.',
    );
  }

  try {
    const messageId =
      via === 'ses'
        ? await sendViaSes(options.to, options.subject, options.html)
        : await sendViaBrevo(options.to, options.subject, options.html);

    // Which provider actually sent it, so a delivery complaint can be traced
    // to the right dashboard without guessing.
    logger.log(
      `mail sent via ${via} to ${options.to} (messageId ${messageId})`,
      'email/index.ts',
    );

    return messageId;
  } catch (error) {
    logger.error(`mail send failed via ${via}: ${error}`, 'email/index.ts');
    throw new BadException(
      `Error occurred while sending email via ${via}: ${error}`,
    );
  }
}

export async function registerTOTP(
  email: string,
  otp: string,
  username: string,
  expiresIn: number,
) {
  const html = registerTOTPEmailTemplate({ otp, username, expiresIn });

  return sendEmail({
    to: email,
    subject: 'Activate Your Account.',
    html,
  });
}

export async function forgotPassword(
  email: string,
  otp: string,
  first_name: string,
  expiresIn: number,
) {
  const html = forgotPasswordEmailTemplate({ otp, first_name, expiresIn });

  return sendEmail({
    to: email,
    subject: 'Reset Your Password.',
    html,
  });
}
