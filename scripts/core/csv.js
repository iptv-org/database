const csv2json = require('csvtojson')
const chalk = require('chalk')
const logger = require('./logger')
const fs = require('mz/fs')
const {
	Parser,
	transforms: { flatten },
	formatters: { stringQuoteOnlyIfNecessary }
} = require('json2csv')

const csv2jsonOptions = {
	checkColumn: true,
	trim: true,
	delimiter: ',',
	eol: '\r\n',
	colParser: {
		alt_names: listParser,
		network: nullable,
		owners: listParser,
		subdivision: nullable,
		city: nullable,
		broadcast_area: listParser,
		languages: listParser,
		categories: listParser,
		is_nsfw: boolParser,
		launched: nullable,
		closed: nullable,
		replaced_by: nullable,
		website: nullable,
		logo: nullable,
		countries: listParser
	}
}

const json2csv = new Parser({
	transforms: [flattenArray, formatBool],
	formatters: {
		string: stringQuoteOnlyIfNecessary()
	},
	eol: '\r\n'
})

const csv = {}

csv.fromFile = async function (filepath) {
	return csv2json(csv2jsonOptions).fromFile(filepath)
}

csv.fromString = async function (filepath) {
	return csv2json(csv2jsonOptions).fromString(filepath)
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

function formatBool(item) {
	for (let prop in item) {
		if (item[prop] === false) {
			item[prop] = 'FALSE'
		} else if (item[prop] === true) {
			item[prop] = 'TRUE'
		}
	}

	return item
}

function listParser(value) {
	return value.split(';').filter(i => i)
}

function boolParser(value) {
	switch (value) {
		case 'TRUE':
			return true
		case 'FALSE':
			return false
		default:
			return value
	}
}

function nullable(value) {
	return value === '' ? null : value
}
