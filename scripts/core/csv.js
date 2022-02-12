const csv2json = require('csvtojson')
const fs = require('mz/fs')
const {
	Parser,
	transforms: { flatten },
	formatters: { stringQuoteOnlyIfNecessary }
} = require('json2csv')

const csv2jsonOptions = {
	checkColumn: true,
	trim: true,
	colParser: {
		countries: listParser,
		languages: listParser,
		categories: listParser,
		broadcast_area: listParser,
		is_nsfw: boolParser,
		logo: nullable,
		subdivision: nullable,
		city: nullable,
		network: nullable
	}
}

const json2csv = new Parser({
	transforms: [flattenArray],
	formatters: {
		string: stringQuoteOnlyIfNecessary()
	}
})

const csv = {}

csv.load = async function (filepath) {
	return csv2json(csv2jsonOptions).fromFile(filepath)
}

csv.save = async function (filepath, data) {
	const string = json2csv.parse(data)

	return fs.writeFile(filepath, string)
}

csv.saveSync = function (filepath, data) {
	const string = json2csv.parse(data)

	return fs.writeFileSync(filepath, string)
}

module.exports = csv

function flattenArray(item) {
	for (let prop in item) {
		const value = item[prop]
		item[prop] = Array.isArray(value) ? value.join(';') : value
	}

	return item
}

function listParser(value) {
	return value.split(';').filter(i => i)
}

function boolParser(value) {
	return value === 'true'
}

function nullable(value) {
	return value === '' ? null : value
}
