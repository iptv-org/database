const Joi = require('joi')

module.exports = {
	id: Joi.string()
		.regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
		.required(),
	name: Joi.string()
		.regex(/^[\sa-zA-Z\u00C0-\u00FF0-9-!:&.+'/»#%°$@?()]+$/)
		.required(),
	network: Joi.string().allow(null),
	country: Joi.string()
		.regex(/^[A-Z]{2}$/)
		.required(),
	subdivision: Joi.string()
		.regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
		.allow(null),
	city: Joi.string().allow(null),
	broadcast_area: Joi.array().items(
		Joi.string().regex(/^(s\/[A-Z]{2}-[A-Z0-9]{1,3}|c\/[A-Z]{2}|r\/[A-Z0-9]{3,7})$/)
	),
	languages: Joi.array()
		.items(Joi.string().regex(/^[a-z]{3}$/))
		.allow(''),
	categories: Joi.array().items(Joi.string().regex(/^[a-z]+$/)),
	is_nsfw: Joi.boolean().required(),
	logo: Joi.string().uri().allow(null)
}
