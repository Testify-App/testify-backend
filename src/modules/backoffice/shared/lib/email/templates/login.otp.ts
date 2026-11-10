import { escape } from 'lodash';
import { backofficeEmailLayout, codeBlock } from './layout';

const loginOTPEmailTemplate = (params: { first_name: string; otp: string; expiresIn: number }): string =>
  backofficeEmailLayout('Your sign-in code', `
    <p>Hi ${escape(params.first_name || 'there')},</p>
    <p>Use this code to finish signing in to the Testify admin portal:</p>
    ${codeBlock(params.otp)}
    <p>The code expires in ${params.expiresIn} minutes. Never share it with anyone.</p>`);

export default loginOTPEmailTemplate;
