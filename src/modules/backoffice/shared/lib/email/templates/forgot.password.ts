import { escape } from 'lodash';
import { backofficeEmailLayout, codeBlock } from './layout';

const forgotPasswordEmailTemplate = (params: { first_name: string; otp: string; expiresIn: number }): string =>
  backofficeEmailLayout('Reset your password', `
    <p>Hi ${escape(params.first_name || 'there')},</p>
    <p>We received a request to reset your Testify admin password. Enter this code to continue:</p>
    ${codeBlock(params.otp)}
    <p>The code expires in ${params.expiresIn} minutes.</p>`);

export default forgotPasswordEmailTemplate;
