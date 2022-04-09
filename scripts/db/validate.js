const { logger, file, csv } = require('../core')
const { program } = require('commander')
const schemes = require('./schemes')
const chalk = require('chalk')
const Joi = require('joi')
const _ = require('lodash')

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

async function main() {
	let globalErrors = []
	const files = program.args.length
		? program.args
		: [
				'data/blocklist.csv',
				'data/categories.csv',
				'data/channels.csv',
				'data/countries.csv',
				'data/languages.csv',
				'data/regions.csv',
				'data/subdivisions.csv'
		  ]
	for (const filepath of files) {
		if (!filepath.endsWith('.csv')) continue

		const eol = await file.eol(filepath)
		if (eol !== 'CRLF') return handleError(`file must have line endings with CRLF (${filepath})`)

		const csvString = await file.read(filepath)
		if (/\s+$/.test(csvString))
			return handleError(`empty lines at the end of file not allowed (${filepath})`)

		const filename = file.getFilename(filepath)
		if (!schemes[filename]) return handleError(`"${filename}" scheme is missing`)

		const rows = await csv
			.fromString(csvString)
			.catch(err => handleError(`${err.message} (${filepath})`))

		let fileErrors = []
		if (filename === 'channels') {
			if (/\"/.test(csvString)) return handleError(`\" character is not allowed (${filepath})`)

			fileErrors = fileErrors.concat(findDuplicatesById(rows))
			let categories = await csv
				.fromFile('data/categories.csv')
				.catch(err => handleError(err.message))
			categories = _.keyBy(categories, 'id')
			let languages = await csv
				.fromFile('data/languages.csv')
				.catch(err => handleError(err.message))
			languages = _.keyBy(languages, 'code')
			let countries = await csv
				.fromFile('data/countries.csv')
				.catch(err => handleError(err.message))
			countries = _.keyBy(countries, 'code')

			for (const [i, row] of rows.entries()) {
				fileErrors = fileErrors.concat(await validateChannelCategories(row, i, categories))
				fileErrors = fileErrors.concat(await validateChannelLanguages(row, i, languages))
				fileErrors = fileErrors.concat(await validateChannelCountry(row, i, countries))
			}
		} else if (filename === 'blocklist') {
			let channels = await csv.fromFile('data/channels.csv').catch(err => handleError(err.message))
			channels = _.keyBy(channels, 'id')

			for (const [i, row] of rows.entries()) {
				fileErrors = fileErrors.concat(await validateChannelId(row, i, channels))
			}
		}

		const schema = Joi.object(schemes[filename])
		rows.forEach((row, i) => {
			const { error } = schema.validate(row, { abortEarly: false })
			if (error) {
				error.details.forEach(detail => {
					fileErrors.push({ line: i + 2, message: detail.message })
				})
			}
		})

		if (fileErrors.length) {
			logger.info(`\n${chalk.underline(filepath)}`)
			fileErrors.forEach(err => {
				const position = err.line.toString().padEnd(6, ' ')
				logger.info(` ${chalk.gray(position)} ${err.message}`)
			})
			globalErrors = globalErrors.concat(fileErrors)
		}
	}

	if (globalErrors.length) return handleError(`${globalErrors.length} error(s)`)
}

main()

function findDuplicatesById(data) {
	data = data.map(i => {
		i.id = i.id.toLowerCase()
		return i
	})

	const errors = []
	const schema = Joi.array().unique((a, b) => a.id === b.id)
	const { error } = schema.validate(data, { abortEarly: false })
	if (error) {
		error.details.forEach(detail => {
			errors.push({
				line: detail.context.pos + 2,
				message: `Entry with the id "${detail.context.value.id}" already exists`
			})
		})
	}

	return errors
}

async function validateChannelCategories(row, i, categories) {
	const errors = []
	row.categories.forEach(category => {
		if (!categories[category]) {
			errors.push({
				line: i + 2,
				message: `"${row.id}" has the wrong category "${category}"`
			})
		}
	})

	return errors
}

async function validateChannelCountry(row, i, countries) {
	const errors = []
	if (!countries[row.country]) {
		errors.push({
			line: i + 2,
			message: `"${row.id}" has the wrong country "${row.country}"`
		})
	}

	return errors
}

async function validateChannelLanguages(row, i, languages) {
	const errors = []
	row.languages.forEach(language => {
		if (!languages[language]) {
			errors.push({
				line: i + 2,
				message: `"${row.id}" has the wrong language "${language}"`
			})
		}
	})

	return errors
}

async function validateChannelId(row, i, channels) {
	const errors = []
	if (!channels[row.channel]) {
		errors.push({
			line: i + 2,
			message: `"${row.channel}" is missing in the channels.csv`
		})
	}

	return errors
}

function handleError(message) {
	logger.error(chalk.red(`\n${message}`))
	process.exit(1)
}
