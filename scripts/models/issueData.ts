import { Dictionary } from '@freearhey/core'

export class IssueData {
  #data: Dictionary<string>

  constructor(data: Dictionary<string>) {
    this.#data = data
  }

  has(key: string): boolean {
    return this.#data.has(key)
  }

  missing(key: string): boolean {
    return this.#data.missing(key) || this.#data.get(key) === undefined
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
      : this.#data.get(key)
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
}
