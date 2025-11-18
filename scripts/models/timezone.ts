import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import { Country } from './country'
import { data } from '../core/db'
import Joi from 'joi'

export class Timezone extends sdk.Models.Timezone implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Timezone {
    if (!row.data.id) throw new Error('Timezone: "id" not specified')
    if (!row.data.utc_offset) throw new Error('Timezone: "utc_offset" not specified')
    if (!row.data.countries) throw new Error('Timezone: "countries" not specified')

    const timezone = new Timezone({
      id: row.data.id.toString(),
      utc_offset: row.data.utc_offset.toString(),
      countries: Array.isArray(row.data.countries) ? row.data.countries : []
    })

    timezone.line = row.line

    return timezone
  }

  hasValidCountryCodes(countriesKeyByCode: Dictionary<Country>): boolean {
    const hasInvalid = this.countries.find((code: string) => countriesKeyByCode.missing(code))

    return !hasInvalid
  }

  getSchema() {
    return Joi.object({
      id: Joi.string()
        .regex(/^[a-z-_/]+$/i)
        .required(),
      utc_offset: Joi.string()
        .regex(/^(\+|-)\d{2}:\d{2}$/)
        .required(),
      countries: Joi.array().items(Joi.string().regex(/^[A-Z]{2}$/))
    })
  }

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return this.toObject() as Record<string, string | string[] | boolean>
  }

  validate(): Collection<ValidatorError> {
    const { countriesKeyByCode } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: this.line, message: `${this.id}: ${detail.message}` })
      })
    }

    if (!this.hasValidCountryCodes(countriesKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.id}" has the wrong countries "${this.countries.join(';')}"`
      })
    }

    return errors
  }
}
