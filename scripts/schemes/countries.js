const Joi = require('joi')

module.exports = {
	name: Joi.string()
		.regex(/^[\sA-Z\u00C0-\u00FF().-]+$/i)
		.required(),
	code: Joi.string()
		.regex(/^[A-Z]{2}$/)
		.required(),
	languages: Joi.array().items(
		Joi.string()
			.regex(/^[a-z]{3}$/)
			.required()
	),
	flag: Joi.string()
		.regex(/^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]$/)
		.required()
}
