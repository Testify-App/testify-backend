import Joi from 'joi';
import { joiPasswordExtendCore } from 'joi-password';

const joiPassword = Joi.extend(joiPasswordExtendCore);

export const passwordSchema = Joi.object({
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
      'password.minOfUppercase':
        '{#label} should contain at least {#min} uppercase character',
      'password.minOfSpecialCharacters':
        '{#label} should contain at least {#min} special character',
      'password.minOfLowercase':
        '{#label} should contain at least {#min} lowercase character',
      'password.minOfNumeric':
        '{#label} should contain at least {#min} numeric character',
      'password.noWhiteSpaces': '{#label} should not contain white spaces',
    }),
});

export const registerPayloadValidator = Joi.object({
  email: Joi.string().email().required(),

  password: joiPassword
    .string()
    .required(),

  username: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z0-9_]{2,19}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Username must be 3–20 characters, start with a letter, and contain only letters, numbers, and underscores",
    }),

  dob: Joi.date()
    .iso()
    .max("now")
    .required()
    .messages({
      "date.base": "Date of birth must be a valid date",
      "date.format": "Date of birth must be in ISO format (YYYY-MM-DD)",
      "date.max": "Date of birth cannot be in the future",
    }),

  avatar: Joi.string().uri().optional(),

  terms_and_condition: Joi.boolean().valid(true).required().messages({
    "any.only": "You must accept the terms and conditions",
  }),
});

export const loginPayloadValidator = Joi.object({
  email: Joi.string().email().required(),

  password: joiPassword
    .string()
    .required(),
});

export const usernameAvailabilityQueryValidator = Joi.object({
  username: Joi.string()
    .pattern(/^[A-Za-z][A-Za-z0-9_]{2,19}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Username must be 3–20 characters, start with a letter, and contain only letters, numbers, and underscores",
    }),
});

export const activateRegistrationPayloadValidator = Joi.object({
  id: Joi.string().uuid().required(),
  token: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required(),
});

export const forgotPasswordPayloadValidator = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyForgotPasswordOTPPayloadValidator = Joi.object({
  id: Joi.string().uuid().required(),
  token: Joi.string()
    .pattern(/^[0-9]{4}$/)
    .required(),
});

export const resetPasswordPayloadValidator = Joi.object({
  id: Joi.string().uuid().required(),
  new_password: passwordSchema.extract('password'),
  confirm_new_password: passwordSchema.extract('password'),
});
