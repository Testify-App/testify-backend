import { escape } from 'lodash';

// Shared shell for backoffice emails. Every caller passes already-escaped body HTML.
/** `heading` is the brand line at the top: the portal for admin emails, the app for user emails. */
export const backofficeEmailLayout = (title: string, body: string, heading = 'Testify Admin'): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f14;font-family:'DM Sans',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0f1623;border:1px solid #181f2c;border-radius:20px;">
        <tr><td style="padding:32px 32px 0;color:#d9ef00;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${escape(heading)}</td></tr>
        <tr><td style="padding:24px 32px 32px;color:#e6e8eb;font-size:15px;line-height:1.6;">${body}</td></tr>
        <tr><td style="padding:0 32px 28px;color:#8b909a;font-size:12px;">If you did not expect this email, you can ignore it or contact your Testify administrator.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const codeBlock = (code: string): string => `
  <div style="margin:24px 0;padding:18px 0;background:#222834;border-radius:14px;text-align:center;font-size:30px;font-weight:700;letter-spacing:10px;color:#ffffff;">${escape(code)}</div>`;

export const buttonLink = (href: string, label: string): string => `
  <p style="margin:28px 0;"><a href="${escape(href)}" style="display:inline-block;padding:14px 28px;background:#d9ef00;color:#0b0f14;border-radius:999px;font-weight:600;text-decoration:none;">${escape(label)}</a></p>
  <p style="color:#8b909a;font-size:13px;word-break:break-all;">Or paste this link into your browser: ${escape(href)}</p>`;
