import Joi from 'joi';

export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    profile: Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required()
    })
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

export const otpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().required()
})