const Joi = require('joi').extend(require('@joi/date'))
const path = require('path')

module.exports = {
	id: Joi.string()
		.regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
		.required(),
	name: Joi.string()
		.regex(/^[a-z0-9-!:&.+'/»#%°$@?\s]+$/i)
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
		.regex(/^[\sa-zA-Z\u00C0-\u00FF0-9'-]+$/)
		.allow(null),
	broadcast_area: Joi.array().items(
		Joi.string()
			.regex(/^(s\/[A-Z]{2}-[A-Z0-9]{1,3}|c\/[A-Z]{2}|r\/[A-Z0-9]{3,7})$/)
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
		.uri({
			scheme: ['http', 'https']
		})
		.allow(null),
	logo: Joi.string()
		.uri({
			scheme: ['https']
		})
		.custom((value, helper) => {
			const ext = path.extname(value)
			if (!ext || /(\.png|\.jpeg|\.jpg)/i.test(ext)) {
				return true
			} else {
				return helper.message(`"logo" has an invalid file extension "${ext}"`)
			}
		})
		.required()
}
