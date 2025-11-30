import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import { Language } from './language'
import * as sdk from '@iptv-org/sdk'
import Joi from 'joi'
import { data } from '../core/db'

export class Country extends sdk.Models.Country implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Country {
    if (!row.data.name) throw new Error('Country: "name" not specified')
    if (!row.data.code) throw new Error('Country: "code" not specified')
    if (!row.data.languages) throw new Error('Country: "languages" not specified')
    if (!row.data.flag) throw new Error('Country: "flag" not specified')

    const country = new Country({
      name: row.data.name.toString(),
      code: row.data.code.toString(),
      languages: Array.isArray(row.data.languages) ? row.data.languages : [],
      flag: row.data.flag.toString()
    })

    country.line = row.line

    return country
  }

  hasValidLanguageCodes(languagesKeyByCode: Dictionary<Language>): boolean {
    const hasInvalid = this.languages.find((code: string) => languagesKeyByCode.missing(code))

    return !hasInvalid
  }

  getSchema() {
    return Joi.object({
      name: Joi.string()
        .regex(/^[\sA-Z\u00C0-\u00FF().-]+$/i)
        .required(),
      code: Joi.string()
        .regex(/^[A-Z]{2}$/)
        .required(),
      languages: Joi.array().items(
        Joi.string()
          .regex(/^[a-z]{3}$/)
          .required()
      ),
      flag: Joi.string()
        .regex(/^[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]$/)
        .required()
    })
  }

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return this.toObject() as Record<string, string | string[] | boolean>
  }

  validate(): Collection<ValidatorError> {
    const { languagesKeyByCode } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: this.line, message: `${this.code}: ${detail.message}` })
      })
    }

    if (!this.hasValidLanguageCodes(languagesKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.code}" has an invalid languages "${this.languages.join(';')}"`
      })
    }

    return errors
  }
}
