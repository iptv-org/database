const { logger, file, csv } = require('../core')
const { program } = require('commander')
const schemes = require('./schemes')
const chalk = require('chalk')
const Joi = require('joi')
const _ = require('lodash')

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

const allFiles = [
	'data/blocklist.csv',
	'data/categories.csv',
	'data/channels.csv',
	'data/countries.csv',
	'data/languages.csv',
	'data/regions.csv',
	'data/subdivisions.csv'
]

let db = {}

async function main() {
	let globalErrors = []

	for (let filepath of allFiles) {
		if (!filepath.endsWith('.csv')) continue

		const eol = await file.eol(filepath)
		if (eol !== 'CRLF') return handleError(`file must have line endings with CRLF (${filepath})`)

		const csvString = await file.read(filepath)
		if (/\s+$/.test(csvString))
			return handleError(`empty lines at the end of file not allowed (${filepath})`)

		const filename = file.getFilename(filepath)
		let data = await csv
			.fromString(csvString)
			.catch(err => handleError(`${err.message} (${filepath})`))

		switch (filename) {
			case 'blocklist':
				data = _.keyBy(data, 'channel')
				break
			case 'categories':
			case 'channels':
				data = _.keyBy(data, 'id')
				break
			default:
				data = _.keyBy(data, 'code')
				break
		}

		db[filename] = data
	}

	const toCheck = program.args.length ? program.args : allFiles
	for (const filepath of toCheck) {
		const filename = file.getFilename(filepath)
		if (!schemes[filename]) return handleError(`"${filename}" scheme is missing`)

		const rows = Object.values(db[filename])

		let fileErrors = []
		if (filename === 'channels') {
			fileErrors = fileErrors.concat(findDuplicatesById(rows))

			for (const [i, row] of rows.entries()) {
				fileErrors = fileErrors.concat(validateChannelBroadcastArea(row, i))
				fileErrors = fileErrors.concat(validateChannelSubdivision(row, i))
				fileErrors = fileErrors.concat(validateChannelCategories(row, i))
				fileErrors = fileErrors.concat(validateChannelLanguages(row, i))
				fileErrors = fileErrors.concat(validateChannelCountry(row, i))
			}
		} else if (filename === 'blocklist') {
			for (const [i, row] of rows.entries()) {
				fileErrors = fileErrors.concat(validateChannelId(row, i))
			}
		} else if (filename === 'countries') {
			for (const [i, row] of rows.entries()) {
				fileErrors = fileErrors.concat(validateCountryLanguage(row, i))
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

function validateChannelCategories(row, i) {
	const errors = []
	row.categories.forEach(category => {
		if (!db.categories[category]) {
			errors.push({
				line: i + 2,
				message: `"${row.id}" has the wrong category "${category}"`
			})
		}
	})

	return errors
}

function validateChannelCountry(row, i) {
	const errors = []
	if (!db.countries[row.country]) {
		errors.push({
			line: i + 2,
			message: `"${row.id}" has the wrong country "${row.country}"`
		})
	}

	return errors
}

function validateChannelSubdivision(row, i) {
	const errors = []
	if (row.subdivision && !db.subdivisions[row.subdivision]) {
		errors.push({
			line: i + 2,
			message: `"${row.id}" has the wrong subdivision "${row.subdivision}"`
		})
	}

	return errors
}

function validateChannelBroadcastArea(row, i) {
	const errors = []
	row.broadcast_area.forEach(area => {
		const [type, code] = area.split('/')
		if (
			(type === 'r' && !db.regions[code]) ||
			(type === 'c' && !db.countries[code]) ||
			(type === 's' && !db.subdivisions[code])
		) {
			errors.push({
				line: i + 2,
				message: `"${row.id}" has the wrong broadcast_area "${area}"`
			})
		}
	})

	return errors
}

function validateChannelLanguages(row, i) {
	const errors = []
	row.languages.forEach(language => {
		if (!db.languages[language]) {
			errors.push({
				line: i + 2,
				message: `"${row.id}" has the wrong language "${language}"`
			})
		}
	})

	return errors
}

function validateChannelId(row, i) {
	const errors = []
	if (!db.channels[row.channel]) {
		errors.push({
			line: i + 2,
			message: `"${row.channel}" is missing in the channels.csv`
		})
	}

	return errors
}

function validateCountryLanguage(row, i) {
	const errors = []
	if (!db.languages[row.lang]) {
		errors.push({
			line: i + 2,
			message: `"${row.code}" has the wrong language "${row.lang}"`
		})
	}

	return errors
}

function handleError(message) {
	logger.error(chalk.red(`\n${message}`))
	process.exit(1)
}
