const Joi = require('joi')

module.exports = {
  name: Joi.string()
    .regex(/^[\sA-Z\u00C0-\u00FF().,-]+$/i)
    .required(),
  code: Joi.string()
    .regex(/^[A-Z]{2,7}$/)
    .required(),
  countries: Joi.array().items(
    Joi.string()
      .regex(/^[A-Z]{2}$/)
      .required()
  )
}
