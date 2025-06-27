import { Dictionary } from '@freearhey/core'

export class IssueData {
  _data: Dictionary
  constructor(data: Dictionary) {
    this._data = data
  }

  has(key: string): boolean {
    return this._data.has(key)
  }

  missing(key: string): boolean {
    return this._data.missing(key) || this._data.get(key) === undefined
  }

  getBoolean(key: string): boolean | undefined {
    if (this.missing(key)) return undefined

    return this._data.get(key) === 'TRUE' ? true : false
  }

  getString(key: string): string | undefined {
    const deleteSymbol = '~'

    return this.missing(key)
      ? undefined
      : this._data.get(key) === deleteSymbol
      ? ''
      : this._data.get(key)
  }

  getNumber(key: string): number | undefined {
    const string = this.getString(key)

    return string ? Number(string) : undefined
  }

  getArray(key: string): string[] | undefined {
    const deleteSymbol = '~'

    if (this._data.missing(key)) return undefined

    return this._data.get(key) === deleteSymbol ? [] : this._data.get(key).split('\r\n')
  }
}
