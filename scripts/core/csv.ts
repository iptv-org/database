import { Collection } from '@freearhey/core'
import { Parser } from '@json2csv/plainjs'
import { stringQuoteOnlyIfNecessary } from '@json2csv/formatters'

export class CSV {
  items: Collection

  constructor({ items }: { items: Collection }) {
    this.items = items
  }

  toString(): string {
    const parser = new Parser({
      transforms: [flattenArray, formatBool],
      formatters: {
        string: stringQuoteOnlyIfNecessary()
      },
      eol: '\r\n'
    })

    return parser.parse(this.items.all())
  }
}

function flattenArray(item: { [key: string]: string[] | string | boolean }) {
  for (const prop in item) {
    const value = item[prop]
    item[prop] = Array.isArray(value) ? value.join(';') : value
  }

  return item
}

function formatBool(item: { [key: string]: string[] | string | boolean }) {
  for (const prop in item) {
    if (item[prop] === false) {
      item[prop] = 'FALSE'
    } else if (item[prop] === true) {
      item[prop] = 'TRUE'
    }
  }

  return item
}
