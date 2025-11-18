import { Validator, ValidatorError } from '../types/validator'
import { Collection } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import Joi from 'joi'

export class Language extends sdk.Models.Language implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Language {
    if (!row.data.code) throw new Error('Language: "code" not specified')
    if (!row.data.name) throw new Error('Language: "name" not specified')

    const language = new Language({
      code: row.data.code.toString(),
      name: row.data.name.toString()
    })

    language.line = row.line

    return language
  }

  getSchema() {
    return Joi.object({
      code: Joi.string()
        .regex(/^[a-z]{3}$/)
        .required(),
      name: Joi.string().required()
    })
  }

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return this.toObject() as Record<string, string | string[] | boolean>
  }

  validate(): Collection<ValidatorError> {
    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: this.line, message: `${this.code}: ${detail.message}` })
      })
    }

    return errors
  }
}
