import Joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';

const joiPassword = Joi.extend(joiPasswordExtendCore);

// Testify admin portal password rule: minimum 8 characters, at least one
// uppercase letter and one number; lowercase and special characters are optional.
export const passwordSchema = Joi.object({
  password: joiPassword
    .string()
    .min(8)
    .minOfUppercase(1)
    .minOfNumeric(1)
    .noWhiteSpaces()
    .required()
    .messages({
      'password.minOfUppercase': '{#label} should contain at least {#min} uppercase character',
      'password.minOfNumeric': '{#label} should contain at least {#min} numeric character',
      'password.noWhiteSpaces': '{#label} should not contain white spaces',
      'string.min': '{#label} should have a minimum length of {#limit}',
    }),
});

export const loginPayloadValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const resendLoginOTPPayloadValidator = Joi.object({
  id: Joi.string().required(),
});

export const verifyLoginOTPPayloadValidator = Joi.object({
  id: Joi.string().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
});

export const forgotPasswordPayloadValidator = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyForgotPasswordOTPPayloadValidator = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'OTP must be exactly 6 digits',
    'string.pattern.base': 'OTP must contain only digits',
  }),
});

// PATCH /auth/me. Phone format (7–15 digits, optional leading +) is checked in the service
// so an invalid number returns 400 rather than a 422 validation error.
export const updateProfilePayloadValidator = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  phone_number: Joi.string().trim().allow('', null).optional(),
});

// PATCH /auth/password. Only presence is checked here; the match, password rule, current-password
// and must-differ checks run in the service so each returns 400 with its own message.
export const changePasswordPayloadValidator = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().required(),
  confirm_new_password: Joi.string().required(),
});

export const resetPasswordPayloadValidator = Joi.object({
  hash_id_key: Joi.string().required(),
  new_password: passwordSchema.extract('password').required(),
  confirm_new_password: Joi.string().required().valid(Joi.ref('new_password')).messages({
    'any.only': 'Confirm new password must match new password',
  }),
});
