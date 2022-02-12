const { csv } = require('../core')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const DATA_DIR = process.env.DATA_DIR || './data'
const OUTPUT_DIR = process.env.OUTPUT_DIR || './.gh-pages'

fs.exists(OUTPUT_DIR, function (exists) {
	if (!exists) {
		fs.mkdirSync(OUTPUT_DIR)
	}
})

glob(`${DATA_DIR}/*.csv`, async function (err, files) {
	for (const inputFile of files) {
		const inputFilename = path.parse(inputFile).name
		const outputFile = `${OUTPUT_DIR}/${inputFilename}.json`

		const json = await csv.load(inputFile)
		fs.writeFileSync(path.resolve(outputFile), JSON.stringify(json))
	}
})
