import { escape } from 'lodash';
import { backofficeEmailLayout } from './layout';

/** Plain notice to an app user about a moderation decision. Every value is HTML-escaped. */
const userModerationEmailTemplate = (params: {
  title: string;
  name: string;
  paragraphs: string[];
}): string =>
  backofficeEmailLayout(
    params.title,
    `<p>Hi ${escape(params.name || 'there')},</p>
    ${params.paragraphs.map((text) => `<p>${escape(text)}</p>`).join('\n')}
    <p style="color:#8b909a;font-size:13px;">Please review the Testify community guidelines. If you believe this was a mistake, reply to this email.</p>`,
    'Testify',
  );

export default userModerationEmailTemplate;
