const { csv, file, logger } = require('../core')
const chalk = require('chalk')

const DATA_DIR = process.env.DATA_DIR || './data'
const OUTPUT_DIR = process.env.OUTPUT_DIR || './.api'

async function main() {
	const files = await file.list(`${DATA_DIR}/*.csv`)
	for (const filepath of files) {
		const filename = file.getFilename(filepath)
		const json = await csv.fromFile(filepath).catch(err => {
			logger.error(chalk.red(`\n${err.message} (${filepath})`))
			process.exit(1)
		})
		await file.create(`${OUTPUT_DIR}/${filename}.json`, JSON.stringify(json))
	}
}

main()
