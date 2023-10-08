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

export class CSVParser {
  async parse(data: string): Promise<Collection> {
    const items = await csv2json(opts).fromString(data)

    return new Collection(items)
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

function nullable(value: string) {
  return value === '' ? null : value
}
