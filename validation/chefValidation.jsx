// validation/chefValidation.jsx

const Joi = require("joi");

const chefSchema = Joi.object({
  specialty: Joi.string().min(3).required().messages({
    "string.empty": "Specialty is required.",
    "string.min": "Specialty must be at least 3 characters long.",
    "any.required": "Specialty is required.",
  }),
});

module.exports = chefSchema;
