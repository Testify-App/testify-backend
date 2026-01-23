// import fs from 'fs';
// import Env from '../../utils/env';
// import logger from '../../services/logger';
// import {
//   Client,
//   SendEmailV3_1,
//   LibraryResponse,
// } from 'node-mailjet';
// import { BadException } from '../../lib/errors';

// const mailjet = new Client({
//   apiKey: `${Env.get<string>('MAIL_API_KEY')}`,
//   apiSecret: `${Env.get<string>('MAIL_API_SECRET')}`,
// });

// export async function sendEmail(data: SendEmailV3_1.Body) {
//   if (Env.get<string>('NODE_ENV') === 'test') return true;
//   try {
//     const result: LibraryResponse<SendEmailV3_1.Response> = await mailjet
//       .post('send', { version: 'v3.1' })
//       .request(data);
//     const { Status } = result.body.Messages[0];
//     return Status;
//   } catch (error) {
//     logger.error(`${error}`, 'mailer.ts');
//     return new BadException(`Error occurred while sending email: ${error} | mailer.ts`);
//   }
// };

// export async function forgotPassword(
//   email: string,
//   otp: string,
//   first_name: string
// ) {
//   const to = email;
//   const from = `<${Env.get<string>('MAIL_FROM')}>`;
//   const html = forgotPasswordEmailTemplate({
//     otp,
//     first_name,
//   });
//   const res = await sendEmail({
//     Messages: [{
//       From: {
//         Email: from,
//       },
//       To: [{
//         Email: to,
//       }],
//       Subject: 'Reset Your Password.',
//       HTMLPart: html,
//     }],
//   });
//   return res;
// };

// export async function backofficeInvite(
//   first_name: string,
//   email: string,
//   password: string,
// ) {
//   const to = email;
//   const from = `<${Env.get<string>('MAIL_FROM')}>`;
//   const html = backofficeInviteEmailTemplate({
//     first_name,
//     email,
//     password,
//     backoffice_portal_url: 'https://meet.google.com/',
//   });
//   const res = await sendEmail({
//     Messages: [{
//       From: {
//         Email: from,
//       },
//       To: [{
//         Email: to,
//       }],
//       Subject: 'Koins Backoffice Invite.',
//       HTMLPart: html,
//     }],
//   });
//   return res;
// };

// export async function sendBackofficeTwoFactorVerificationCode(
//   email: string,
//   otp: string,
//   first_name: string
// ) {
//   const to = email;
//   const from = `<${Env.get<string>('MAIL_FROM')}>`;
//   first_name = `${first_name[0].toUpperCase()}${first_name.slice(1)}`;
//   const html = backofficeTwoFactorAuthenticationEmailTemplate({
//     otp,
//     first_name,
//   });
//   const res = await sendEmail({
//     Messages: [{
//       From: {
//         Email: from,
//       },
//       To: [{
//         Email: to,
//       }],
//       Subject: 'Backoffice Two-Factor Authentication.',
//       HTMLPart: html,
//     }],
//   });
//   return res;
// };

// export async function sendBackofficeBulkInviteEmailWithCSV(
//   csvFilePath: string,
//   email: string
// ) {
//   const to = `${email}`;
//   const from = `<${Env.get<string>('MAIL_FROM')}>`;
//   const csvContent = fs.readFileSync(csvFilePath);
//   const base64Content = csvContent.toString('base64');
//   const html = bulkInviteEmailTemplate({
//     date: new Date().toDateString(),
//   });
//   const res = await sendEmail({
//     Messages: [{
//       From: {
//         Email: from,
//       },
//       To: [{
//         Email: to,
//       }],
//       Subject: 'Backoffice Invite.',
//       HTMLPart: html,
//       Attachments: [
//         {
//           ContentType: 'text/csv',
//           Filename: 'invite.csv',
//           Base64Content: base64Content,
//         },
//       ]
//     }],
//   });
//   return res;
// };

// export async function reassignRole(
//   email: string,
//   first_name: string,
//   role_name: string
// ) {
//   const to = email;
//   const from = `<${Env.get<string>('MAIL_FROM')}>`;
//   first_name = `${first_name[0].toUpperCase()}${first_name.slice(1)}`;
//   const html = reassignRoleEmailTemplate({
//     first_name, role_name,
//   });
//   const res = await sendEmail({
//     Messages: [{
//       From: {
//         Email: from,
//       },
//       To: [{
//         Email: to,
//       }],
//       Subject: 'Reassigned role.',
//       HTMLPart: html,
//     }],
//   });
//   return res;
// };

// export async function transferSuccess(
//   payload: walletDTO.TransferEmailDataDTO,
// ) {
//   const {
//     to, first_name, amount, bank_name, account_name, account_number, reference,
//   } = payload;
//   const from = `<${Env.get<string>('MAIL_FROM')}>`;
//   const current_time = new Date().toISOString();
//   const html = transferReportEmailTemplate({
//     first_name, amount, bank_name, account_name, account_number, reference, current_time,
//   });
//   const res = await sendEmail({
//     Messages: [{
//       From: {
//         Email: from,
//       },
//       To: [{
//         Email: to,
//       }],
//       Subject: 'Transaction Status',
//       HTMLPart: html,
//     }],
//   });
//   return res;
// };

// export async function swiftLoanApproval(
//   payload: { first_name: string; email: string; content: string },
// ) {
//   return await sendEmail({
//     Messages: [{
//       From: { Email: `<${Env.get<string>('MAIL_FROM')}>` },
//       To: [{ Email: payload.email }],
//       Subject: 'Swift Loan Approval',
//       HTMLPart: swiftLoanApprovalTemplate({ first_name: payload.first_name, content: payload.content }),
//     }],
//   });
// };

// export async function swiftLoanRejection(
//   payload: { first_name: string; email: string; content: string },
// ) {
//   return await sendEmail({
//     Messages: [{
//       From: { Email: `<${Env.get<string>('MAIL_FROM')}>` },
//       To: [{ Email: payload.email }],
//       Subject: 'Swift Loan Rejection',
//       HTMLPart: swiftLoanRejectionTemplate({ first_name: payload.first_name, rejection_reason: payload.content }),
//     }],
//   });
// };

// export async function changePassword(
//   payload: { first_name: string; email: string; otp: string },
// ) {
//   return await sendEmail({
//     Messages: [{
//       From: { Email: `<${Env.get<string>('MAIL_FROM')}>` },
//       To: [{ Email: payload.email }],
//       Subject: 'Change Password',
//       HTMLPart: changePasswordEmailTemplate({ first_name: payload.first_name, otp: payload.otp }),
//     }],
//   });
// };

// export async function adminEmailNotification(
//   payload: { title: string; to: Array<{ Email: string }>; content: string },
// ) {
//   return await sendEmail({
//     Messages: [{
//       From: { Email: `<${Env.get<string>('MAIL_FROM')}>` },
//       To: payload.to,
//       Subject: 'Email Notification',
//       HTMLPart: adminEmailNotificationTemplate({ content: payload.content, title: payload.title }),
//     }],
//   });
// };
