"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordPayloadValidator = exports.verifyForgotPasswordOTPPayloadValidator = exports.forgotPasswordPayloadValidator = exports.activateRegistrationPayloadValidator = exports.usernameAvailabilityQueryValidator = exports.loginPayloadValidator = exports.registerPayloadValidator = exports.passwordSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const joi_password_1 = require("joi-password");
const joiPassword = joi_1.default.extend(joi_password_1.joiPasswordExtendCore);
exports.passwordSchema = joi_1.default.object({
    password: joiPassword
        .string()
        .min(8)
        .minOfSpecialCharacters(1)
        .minOfLowercase(1)
        .minOfUppercase(1)
        .minOfNumeric(1)
        .noWhiteSpaces()
        .required()
        .messages({
        'password.minOfUppercase': '{#label} should contain at least {#min} uppercase character',
        'password.minOfSpecialCharacters': '{#label} should contain at least {#min} special character',
        'password.minOfLowercase': '{#label} should contain at least {#min} lowercase character',
        'password.minOfNumeric': '{#label} should contain at least {#min} numeric character',
        'password.noWhiteSpaces': '{#label} should not contain white spaces',
    }),
});
exports.registerPayloadValidator = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joiPassword
        .string()
        .required(),
    username: joi_1.default.string()
        .pattern(/^[A-Za-z][A-Za-z0-9_]{2,19}$/)
        .required()
        .messages({
        "string.pattern.base": "Username must be 3–20 characters, start with a letter, and contain only letters, numbers, and underscores",
    }),
    dob: joi_1.default.date()
        .iso()
        .max("now")
        .required()
        .messages({
        "date.base": "Date of birth must be a valid date",
        "date.format": "Date of birth must be in ISO format (YYYY-MM-DD)",
        "date.max": "Date of birth cannot be in the future",
    }),
    avatar: joi_1.default.string().uri().optional(),
    terms_and_condition: joi_1.default.boolean().valid(true).required().messages({
        "any.only": "You must accept the terms and conditions",
    }),
});
exports.loginPayloadValidator = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joiPassword
        .string()
        .required(),
});
exports.usernameAvailabilityQueryValidator = joi_1.default.object({
    username: joi_1.default.string()
        .pattern(/^[A-Za-z][A-Za-z0-9_]{2,19}$/)
        .required()
        .messages({
        "string.pattern.base": "Username must be 3–20 characters, start with a letter, and contain only letters, numbers, and underscores",
    }),
});
exports.activateRegistrationPayloadValidator = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    token: joi_1.default.string()
        .pattern(/^[0-9]{6}$/)
        .required(),
});
exports.forgotPasswordPayloadValidator = joi_1.default.object({
    email: joi_1.default.string().email().required(),
});
exports.verifyForgotPasswordOTPPayloadValidator = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    token: joi_1.default.string()
        .pattern(/^[0-9]{6}$/)
        .required(),
});
exports.resetPasswordPayloadValidator = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    new_password: exports.passwordSchema.extract('password'),
    confirm_new_password: exports.passwordSchema.extract('password'),
});
//# sourceMappingURL=validator.js.map