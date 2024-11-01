import Joi from "joi";

export const userSignupSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
    "string.base": "Name must be a string",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  wallet_pin: Joi.string().length(4).pattern(/^\d+$/).required().messages({
    "any.required": "Wallet PIN is required",
    "string.length": "Wallet PIN must be exactly 4 digits",
    "string.pattern.base": "Wallet PIN must be a number",
  }),
  phone_number: Joi.string().length(14).required().messages({
    "any.required": "Phone number is required",
    "string.length": "Phone number must be exactly 15 characters",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "numbers")
    .pattern(/[!@#$%^&*]/, "special characters")
    .required()
    .messages({
      "any.required": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.pattern.name":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),

  identity: Joi.string(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
  identity: Joi.string(),
});

export const userWalletSchema = Joi.object({
  wallet_id: Joi.number().required().messages({
    "any.required": "Wallet ID is required",
    "number.base": "Wallet ID must be a number",
  }),
  amount: Joi.number().min(1).max(1000000).required().messages({
    "any.required": "Amount is required",
    "number.base": "Amount must be a number",
    "number.min": "Amount must be at least N1",
    "number.max": "Amount must not exceed N1,000,000",
  }),
  wallet_pin: Joi.string().length(4).pattern(/^\d+$/).required().messages({
    "any.required": "Wallet PIN is required",
    "string.length": "Wallet PIN must be exactly 4 digits",
    "string.pattern.base": "Wallet PIN must be a number",
  }),
});
