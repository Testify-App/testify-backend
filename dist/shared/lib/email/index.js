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
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const env_1 = __importDefault(require("../../utils/env"));
const logger_1 = __importDefault(require("../../services/logger"));
const errors_1 = require("../../lib/errors");
const register_TOTP_1 = __importDefault(require("./templates/register.TOTP"));
const forgot_password_1 = __importDefault(require("./templates/forgot.password"));
const transportKind = () => {
    var _a;
    return ((_a = env_1.default.get('MAIL_TRANSPORT')) !== null && _a !== void 0 ? _a : 'ses').toLowerCase() === 'smtp'
        ? 'smtp'
        : 'ses';
};
let cached;
const buildTransport = () => {
    var _a, _b;
    if (transportKind() === 'smtp') {
        return nodemailer_1.default.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: `${env_1.default.get('MAIL_USER')}`,
                pass: `${env_1.default.get('MAIL_APP_PASSWORD')}`,
            },
        });
    }
    const sesClient = new client_sesv2_1.SESv2Client({
        region: (_b = (_a = env_1.default.get('AWS_SES_REGION')) !== null && _a !== void 0 ? _a : env_1.default.get('AWS_S3_REGION')) !== null && _b !== void 0 ? _b : 'us-east-1',
    });
    return nodemailer_1.default.createTransport({
        SES: { sesClient, SendEmailCommand: client_sesv2_1.SendEmailCommand },
    });
};
const transport = () => (cached !== null && cached !== void 0 ? cached : (cached = buildTransport()));
function sendEmail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (env_1.default.get('NODE_ENV') === 'test')
            return true;
        try {
            const info = yield transport().sendMail({
                from: `${env_1.default.get('MAIL_FROM')}`,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
            logger_1.default.info(`mail sent via ${transportKind()} to ${options.to}: ${info.messageId}`, 'mailer.ts');
            return info.messageId;
        }
        catch (error) {
            logger_1.default.error(`${error}`, 'mailer.ts');
            throw new errors_1.BadException(`Error occurred while sending email: ${error} | mailer.ts`);
        }
    });
}
function registerTOTP(email, otp, username, expiresIn) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = (0, register_TOTP_1.default)({
            otp,
            username,
            expiresIn,
        });
        return sendEmail({
            to: email,
            subject: 'Activate Your Account.',
            html,
        });
    });
}
;
function forgotPassword(email, otp, first_name, expiresIn) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = (0, forgot_password_1.default)({
            otp,
            first_name,
            expiresIn,
        });
        return sendEmail({
            to: email,
            subject: 'Reset Your Password.',
            html,
        });
    });
}
;
//# sourceMappingURL=index.js.map