import { escape } from 'lodash';
import { backofficeEmailLayout, buttonLink } from './layout';

const staffInviteEmailTemplate = (params: {
  first_name: string;
  role: string;
  invited_by: string;
  link: string;
  expiresInHours: number;
}): string =>
  backofficeEmailLayout('You have been invited to Testify Admin', `
    <p>Hi ${escape(params.first_name || 'there')},</p>
    <p>${escape(params.invited_by)} has invited you to join the Testify admin portal as
      <strong style="color:#ffffff;">${escape(params.role)}</strong>.</p>
    <p>Set your password to activate your account:</p>
    ${buttonLink(params.link, 'Accept invitation')}
    <p>This link expires in ${params.expiresInHours} hours.</p>`);

export default staffInviteEmailTemplate;
