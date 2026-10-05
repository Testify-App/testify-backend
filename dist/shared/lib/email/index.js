"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.registerTOTP = registerTOTP;
exports.forgotPassword = forgotPassword;
const brevo_1 = require("@getbrevo/brevo");
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const logger_1 = __importDefault(require("../../services/logger"));
const errors_1 = require("../../lib/errors");
const register_TOTP_1 = __importDefault(require("./templates/register.TOTP"));
const forgot_password_1 = __importDefault(require("./templates/forgot.password"));
const transport = () => (process.env.MAIL_TRANSPORT || 'brevo').trim().toLowerCase();
const mailFrom = () => process.env.MAIL_FROM || process.env.TESTIFY_MAIL_FROM || '';
const parseSender = (value) => {
    const match = value.match(/^(.*)<(.+)>$/);
    if (match) {
        return { name: match[1].trim() || undefined, email: match[2].trim() };
    }
    return { email: value.trim() };
};
let brevo;
const brevoClient = () => {
    if (brevo)
        return brevo;
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not set, but MAIL_TRANSPORT is "brevo". Set it at ' +
            '/testifyhub/prod/app/BREVO_API_KEY, or set MAIL_TRANSPORT to "ses".');
    }
    brevo = new brevo_1.BrevoClient({ apiKey });
    return brevo;
};
const sendViaBrevo = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield brevoClient().transactionalEmails.sendTransacEmail({
        sender: parseSender(mailFrom()),
        to: [{ email: to }],
        subject,
        htmlContent: html,
    });
    return response.messageId;
});
let ses;
const sesClient = () => {
    if (ses)
        return ses;
    ses = new client_sesv2_1.SESv2Client({
        region: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
    });
    return ses;
};
const sendViaSes = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield sesClient().send(new client_sesv2_1.SendEmailCommand({
        FromEmailAddress: mailFrom(),
        Destination: { ToAddresses: [to] },
        ConfigurationSetName: process.env.MAIL_CONFIGURATION_SET,
        Content: {
            Simple: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: { Html: { Data: html, Charset: 'UTF-8' } },
            },
        },
    }));
    return result.MessageId;
});
function sendEmail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV === 'test' || process.env.TESTIFY_NODE_ENV === 'test') {
            return true;
        }
        const via = transport();
        if (!mailFrom()) {
            throw new errors_1.BadException('MAIL_FROM is not set. It is supplied from Parameter Store at ' +
                '/testifyhub/prod/app/TESTIFY_MAIL_FROM.');
        }
        try {
            const messageId = via === 'ses'
                ? yield sendViaSes(options.to, options.subject, options.html)
                : yield sendViaBrevo(options.to, options.subject, options.html);
            logger_1.default.info(`mail sent via ${via} to ${options.to} (messageId ${messageId})`, 'email/index.ts');
            return messageId;
        }
        catch (error) {
            logger_1.default.error(`mail send failed via ${via}: ${error}`, 'email/index.ts');
            throw new errors_1.BadException(`Error occurred while sending email via ${via}: ${error}`);
        }
    });
}
function registerTOTP(email, otp, username, expiresIn) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = (0, register_TOTP_1.default)({ otp, username, expiresIn });
        return sendEmail({
            to: email,
            subject: 'Activate Your Account.',
            html,
        });
    });
}
function forgotPassword(email, otp, first_name, expiresIn) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = (0, forgot_password_1.default)({ otp, first_name, expiresIn });
        return sendEmail({
            to: email,
            subject: 'Reset Your Password.',
            html,
        });
    });
}
//# sourceMappingURL=index.js.map