const Joi = require('joi')

module.exports = {
	id: Joi.string()
		.regex(/^[a-z]+$/)
		.required(),
	name: Joi.string()
		.regex(/^[A-Z]+$/i)
		.required()
}
