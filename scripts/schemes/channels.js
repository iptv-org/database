const Joi = require('joi').extend(require('@joi/date'))
const path = require('path')
const url = require('url')

module.exports = {
  id: Joi.string()
    .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
    .required(),
  name: Joi.string()
    .regex(/^[a-z0-9-!:&.+'/»#%°$@?|¡–\s_—]+$/i)
    .required(),
  alt_names: Joi.array().items(
    Joi.string()
      .regex(/^[^",]+$/)
      .invalid(Joi.ref('name'))
  ),
  network: Joi.string()
    .regex(/^[^",]+$/)
    .allow(null),
  owners: Joi.array().items(Joi.string().regex(/^[^",]+$/)),
  country: Joi.string()
    .regex(/^[A-Z]{2}$/)
    .required(),
  subdivision: Joi.string()
    .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
    .allow(null),
  city: Joi.string()
    .regex(/^[^",]+$/)
    .allow(null),
  broadcast_area: Joi.array().items(
    Joi.string()
      .regex(/^(s\/[A-Z]{2}-[A-Z0-9]{1,3}|c\/[A-Z]{2}|r\/[A-Z0-9]{2,7})$/)
      .required()
  ),
  languages: Joi.array().items(
    Joi.string()
      .regex(/^[a-z]{3}$/)
      .required()
  ),
  categories: Joi.array().items(Joi.string().regex(/^[a-z]+$/)),
  is_nsfw: Joi.boolean().strict().required(),
  launched: Joi.date().format('YYYY-MM-DD').raw().allow(null),
  closed: Joi.date().format('YYYY-MM-DD').raw().allow(null).greater(Joi.ref('launched')),
  replaced_by: Joi.string()
    .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
    .allow(null),
  website: Joi.string()
    .regex(/,/, { invert: true })
    .uri({
      scheme: ['http', 'https']
    })
    .allow(null),
  logo: Joi.string()
    .regex(/,/, { invert: true })
    .uri({
      scheme: ['https']
    })
    .custom((value, helper) => {
      const ext = path.extname(url.parse(value).pathname)
      if (!ext || /(\.png|\.jpeg|\.jpg)/i.test(ext)) {
        return true
      } else {
        return helper.message(`"logo" has an invalid file extension "${ext}"`)
      }
    })
    .required()
}
