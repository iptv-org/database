import { Collection } from '@freearhey/core'
import csv2json from 'csvtojson'

const opts = {
  checkColumn: true,
  trim: true,
  delimiter: ',',
  eol: '\r\n',
  colParser: {
    alt_names: listParser,
    network: nullable,
    owners: listParser,
    subdivision: nullable,
    broadcast_area: listParser,
    languages: listParser,
    categories: listParser,
    is_nsfw: boolParser,
    launched: nullable,
    closed: nullable,
    replaced_by: nullable,
    website: nullable,
    logo: nullable,
    countries: listParser,
    timezones: listParser,
    is_main: boolParser,
    format: nullable,
    feed: nullable,
    tags: listParser,
    width: numberParser,
    height: numberParser,
    parent: nullable
  }
}

export class CSVParser {
  async parse(data: string): Promise<Collection> {
    const parsed = await csv2json(opts).fromString(data)
    const rows = parsed.map((data, i) => {
      return { line: i + 2, data }
    })

    return new Collection(rows)
  }
}

function listParser(value: string) {
  return value.split(';').filter(i => i)
}

function boolParser(value: string) {
  switch (value) {
    case 'TRUE':
      return true
    case 'FALSE':
      return false
    default:
      return value
  }
}

function numberParser(value: string) {
  return Number(value)
}

function nullable(value: string) {
  return value === '' ? null : value
}
