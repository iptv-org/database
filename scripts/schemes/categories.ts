import Joi from 'joi'

export default {
  id: Joi.string()
    .regex(/^[a-z]+$/)
    .required(),
  name: Joi.string()
    .regex(/^[A-Z]+$/i)
    .required()
}
