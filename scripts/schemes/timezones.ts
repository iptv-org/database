import Joi from 'joi'

export default {
  id: Joi.string()
    .regex(/^[a-z-_/]+$/i)
    .required(),
  utc_offset: Joi.string()
    .regex(/^(\+|-)\d{2}:\d{2}$/)
    .required(),
  countries: Joi.array().items(Joi.string().regex(/^[A-Z]{2}$/))
}
