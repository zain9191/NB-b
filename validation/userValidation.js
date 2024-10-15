 const Joi = require('joi');

const registerSchema = Joi.object({
  fullName: Joi.string().min(1).max(255).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phoneNumber: Joi.string().min(7).max(15).required(),
  postalCode: Joi.string().min(1).max(20).required(),
  profilePicture: Joi.string().uri().optional(),
});

module.exports = { registerSchema };
