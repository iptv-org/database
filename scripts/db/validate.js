const { logger, file, csv } = require('../core')
const { program } = require('commander')
const schemes = require('./schemes')
const chalk = require('chalk')
const Joi = require('joi')

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

async function main() {
	let errors = []
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
		if (eol !== 'CRLF') {
			logger.error(chalk.red(`\nError: file must have line endings with CRLF (${filepath})`))
			process.exit(1)
		}

		const csvString = await file.read(filepath)
		if (/\s+$/.test(csvString)) {
			logger.error(chalk.red(`\nError: empty lines at the end of file not allowed (${filepath})`))
			process.exit(1)
		}

		const filename = file.getFilename(filepath)
		if (!schemes[filename]) {
			logger.error(chalk.red(`\nError: "${filename}" scheme is missing`))
			process.exit(1)
		}

		const data = await csv.fromString(csvString).catch(err => {
			logger.error(chalk.red(`\n${err.message} (${filepath})`))
			process.exit(1)
		})

		let fileErrors = []
		if (filename === 'channels') {
			if (/\"/.test(csvString)) {
				logger.error(chalk.red(`\nError: \" character is not allowed (${filepath})`))
				process.exit(1)
			}

			fileErrors = fileErrors.concat(findDuplicatesById(data))
		}

		const schema = Joi.object(schemes[filename])
		data.forEach((row, i) => {
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
				logger.error(` ${chalk.gray(position)} ${err.message}`)
			})
			errors = errors.concat(fileErrors)
		}
	}

	if (errors.length) {
		logger.error(chalk.red(`\n${errors.length} error(s)`))
		process.exit(1)
	}
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
