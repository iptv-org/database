import Joi from 'joi'

export default {
  code: Joi.string()
    .regex(/^[a-z]{3}$/)
    .required(),
  name: Joi.string().required()
}
