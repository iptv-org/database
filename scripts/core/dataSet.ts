import { Dictionary } from '@freearhey/core'
import * as validator from './validator'

type Field = {
  key: string
  label: string
  alias?: string
  type: 'string' | 'string[]' | 'boolean' | 'number'
}

const fields: Field[] = [
  { key: 'channel_id', label: 'Channel ID', type: 'string' },
  { key: 'channel_name', label: 'Channel Name', type: 'string' },
  { key: 'feed_name', label: 'Feed Name', type: 'string' },
  { key: 'feed_alt_names', label: 'Feed Alternative Names', type: 'string[]' },
  { key: 'feed_id', label: 'Feed ID', type: 'string' },
  { key: 'is_main', label: 'Main Feed', type: 'boolean' },
  { key: 'alt_names', label: 'Alternative Names', type: 'string[]' },
  { key: 'network', label: 'Network', type: 'string' },
  { key: 'owners', label: 'Owners', type: 'string[]' },
  { key: 'country', label: 'Country', type: 'string' },
  { key: 'subdivision', label: 'Subdivision', type: 'string' },
  { key: 'broadcast_area', label: 'Broadcast Area', type: 'string[]' },
  { key: 'timezones', label: 'Timezones', type: 'string[]' },
  { key: 'format', label: 'Format', type: 'string' },
  { key: 'languages', label: 'Languages', type: 'string[]' },
  { key: 'categories', label: 'Categories', type: 'string[]' },
  { key: 'is_nsfw', label: 'NSFW', type: 'boolean' },
  { key: 'launched', label: 'Launched', type: 'string' },
  { key: 'closed', label: 'Closed', type: 'string' },
  { key: 'replaced_by', label: 'Replaced By', type: 'string' },
  { key: 'website', label: 'Website', type: 'string' },
  { key: 'reason', label: 'Reason', type: 'string' },
  { key: 'notes', label: 'Notes', type: 'string' },
  { key: 'ref', label: 'Reference', type: 'string' },
  { key: 'logo_url', label: 'Logo URL', type: 'string' },
  { key: 'tags', label: 'Tags', alias: 'Logo Tags', type: 'string[]' },
  { key: 'width', label: 'Width', type: 'number' },
  { key: 'height', label: 'Height', type: 'number' },
  { key: 'new_channel_id', label: 'New Channel ID', type: 'string' },
  { key: 'new_feed_id', label: 'New Feed ID', type: 'string' },
  { key: 'new_logo_url', label: 'New Logo URL', type: 'string' },
  { key: 'city_name', label: 'City Name', type: 'string' },
  { key: 'city_code', label: 'City Code', type: 'string' },
  { key: 'wikidata_id', label: 'Wikidata ID', type: 'string' },
  { key: 'in_use', label: 'In Use', type: 'boolean' }
]

export type DataType = string | string[] | number | boolean

export class DataSet {
  #data: Dictionary<DataType>

  constructor(data: Dictionary<DataType>) {
    this.#data = data
  }

  set(key: string, value: DataType) {
    this.#data.set(key, value)
  }

  has(key: string): boolean {
    return this.#data.has(key)
  }

  missing(key: string | string[]): boolean {
    const keys = Array.isArray(key) ? key : [key]

    return keys.every(_key => this.#data.get(_key) === undefined)
  }

  isDeleted(key: string): boolean {
    const deleteSymbol = '~'

    return this.#data.get(key) === deleteSymbol
  }

  getRaw(key: string): DataType | undefined {
    return this.#data.get(key)
  }

  getBoolean(key: string): boolean | undefined {
    if (this.missing(key)) return undefined

    return this.#data.get(key) === 'TRUE' ? true : false
  }

  getString(key: string): string | undefined {
    const deleteSymbol = '~'

    return this.missing(key)
      ? undefined
      : this.#data.get(key) === deleteSymbol
        ? ''
        : String(this.#data.get(key))
  }

  getNumber(key: string): number | undefined {
    const string = this.getString(key)

    return string ? Number(string) : undefined
  }

  getArray(key: string): string[] | undefined {
    const deleteSymbol = '~'

    if (this.#data.missing(key)) return undefined

    const value = this.#data.get(key)

    if (typeof value !== 'string') return undefined

    return value === deleteSymbol ? [] : value.split(/[\r\n;]/)
  }

  getChanged(): string[] {
    const keys = Object.keys(this.#data)

    return keys.filter((key: string) => this.#data.has(key))
  }

  static getLabel(key: string): string | undefined {
    const found = fields.find(field => field.key === key)
    return found?.label
  }

  static getType(key: string): string | undefined {
    const found = fields.find(field => field.key === key)
    return found?.type
  }

  getValue(key: string): DataType | undefined {
    const type = DataSet.getType(key)
    if (type === 'string[]') {
      return this.getArray(key)
    } else if (type === 'boolean') {
      return this.getBoolean(key)
    } else if (type === 'number') {
      return this.getNumber(key)
    }

    return this.getString(key)
  }

  static getKeyForLabel(label: string): string | undefined {
    const found = Object.values(fields).find(
      field => field.label === label || field.alias === label
    )

    return found?.key
  }

  validate(key: string, rules: validator.RuleId[]): string[] {
    let errors: string[] = []

    const label = DataSet.getLabel(key)
    const value = this.getValue(key)
    const values = Array.isArray(value) ? value : [value]

    if (label) {
      values.forEach(value => {
        errors = errors.concat(validator.validate(label, value, rules))
      })
    }

    return errors
  }
}
