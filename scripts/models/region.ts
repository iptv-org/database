import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import { Country } from './country'
import { data } from '../core/db'
import Joi from 'joi'

export class Region extends sdk.Models.Region implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Region {
    if (!row.data.code) throw new Error('Region: "code" not specified')
    if (!row.data.name) throw new Error('Region: "name" not specified')
    if (!row.data.countries) throw new Error('Region: "countries" not specified')

    const region = new Region({
      code: row.data.code.toString(),
      name: row.data.name.toString(),
      countries: Array.isArray(row.data.countries) ? row.data.countries : []
    })

    region.line = row.line

    return region
  }

  hasValidCountries(countriesKeyByCode: Dictionary<Country>): boolean {
    const hasInvalid = this.countries.find((code: string) => countriesKeyByCode.missing(code))

    return !hasInvalid
  }

  getSchema() {
    return Joi.object({
      name: Joi.string()
        .regex(/^[\sA-Z\u00C0-\u00FF().,-]+$/i)
        .required(),
      code: Joi.string()
        .regex(/^[A-Z]{2,7}$/)
        .required(),
      countries: Joi.array().items(
        Joi.string()
          .regex(/^[A-Z]{2}$/)
          .required()
      )
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
        errors.add({ line: this.line, message: `${this.code}: ${detail.message}` })
      })
    }

    if (!this.hasValidCountries(countriesKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.code}" has the wrong countries "${this.countries.join(';')}"`
      })
    }

    return errors
  }
}
