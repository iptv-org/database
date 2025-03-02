import Joi from 'joi'

export default {
  channel: Joi.string()
    .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
    .required(),
  reason: Joi.string()
    .valid(...['dmca', 'nsfw'])
    .required(),
  ref: Joi.string().uri().required()
}
