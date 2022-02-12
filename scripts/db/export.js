const { csv, file } = require('../core')

const DATA_DIR = process.env.DATA_DIR || './data'
const OUTPUT_DIR = process.env.OUTPUT_DIR || './.gh-pages'

async function main() {
	const files = await file.list(`${DATA_DIR}/*.csv`)
	for (const inputFile of files) {
		const inputFilename = file.getFilename(inputFile)
		const json = await csv.load(inputFile)
		await file.create(`${OUTPUT_DIR}/${inputFilename}.json`, JSON.stringify(json))
	}
}

main()
