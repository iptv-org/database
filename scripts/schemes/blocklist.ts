import Joi from 'joi'

export default {
  channel: Joi.string()
    .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
    .required(),
  ref: Joi.string().uri().required()
}
