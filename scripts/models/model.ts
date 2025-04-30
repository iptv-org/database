export class Model {
  line?: number

  constructor() {}

  setLine(line: number): this {
    this.line = line

    return this
  }

  getLine(): number {
    return this.line || 0
  }
}
