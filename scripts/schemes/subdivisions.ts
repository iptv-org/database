import Joi from 'joi'

export default {
  country: Joi.string()
    .regex(/^[A-Z]{2}$/)
    .required(),
  name: Joi.string().required(),
  code: Joi.string()
    .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
    .required()
}
