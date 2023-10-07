const Joi = require('joi')

module.exports = {
	code: Joi.string()
		.regex(/^[a-z]{3}$/)
		.required(),
	name: Joi.string().required()
}
