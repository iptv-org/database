import BaseJoi from 'joi'
import JoiDate from '@joi/date'

const Joi = BaseJoi.extend(JoiDate)

export default {
  channel: Joi.string()
    .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
    .required(),
  id: Joi.string()
    .regex(/^[A-Za-z0-9]+$/)
    .required(),
  name: Joi.string()
    .regex(/^[a-z0-9-!:&.+'/»#%°$@?|¡–\s_—]+$/i)
    .regex(/^((?!\s-\s).)*$/)
    .required(),
  is_main: Joi.boolean().strict().required(),
  broadcast_area: Joi.array().items(
    Joi.string()
      .regex(/^(s\/[A-Z]{2}-[A-Z0-9]{1,3}|c\/[A-Z]{2}|r\/[A-Z0-9]{2,7})$/)
      .required()
  ),
  timezones: Joi.array().items(
    Joi.string()
      .regex(/^[a-z-_/]+$/i)
      .required()
  ),
  languages: Joi.array().items(
    Joi.string()
      .regex(/^[a-z]{3}$/)
      .required()
  ),
  video_format: Joi.string()
    .regex(/^\d+(i|p)$/)
    .allow(null)
}
