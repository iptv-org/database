import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import { Country } from './country'
import { data } from '../core/db'
import Joi from 'joi'

export class Subdivision extends sdk.Models.Subdivision implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Subdivision {
    if (!row.data.country) throw new Error('Subdivision: "country" not specified')
    if (!row.data.code) throw new Error('Subdivision: "code" not specified')
    if (!row.data.name) throw new Error('Subdivision: "name" not specified')

    const subdivision = new Subdivision({
      country: row.data.country.toString(),
      code: row.data.code.toString(),
      name: row.data.name.toString(),
      parent: row.data.parent ? row.data.parent.toString() : null
    })

    subdivision.line = row.line

    return subdivision
  }

  hasValidCountryCode(countriesKeyByCode: Dictionary<Country>): boolean {
    return countriesKeyByCode.has(this.country)
  }

  hasValidParent(subdivisionsKeyByCode: Dictionary<Subdivision>): boolean {
    if (!this.parent) return true

    return subdivisionsKeyByCode.has(this.parent)
  }

  getSchema() {
    return Joi.object({
      country: Joi.string()
        .regex(/^[A-Z]{2}$/)
        .required(),
      name: Joi.string().required(),
      code: Joi.string()
        .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
        .required(),
      parent: Joi.string()
        .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
        .allow(null)
    })
  }

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return this.toObject() as Record<string, string | string[] | boolean>
  }

  validate(): Collection<ValidatorError> {
    const { countriesKeyByCode, subdivisionsKeyByCode } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({
          line: this.line,
          message: `${this.code}: ${detail.message}`
        })
      })
    }

    if (!this.hasValidCountryCode(countriesKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.code}" has an invalid country "${this.country}"`
      })
    }

    if (!this.hasValidParent(subdivisionsKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.code}" has an invalid parent "${this.parent}"`
      })
    }

    return errors
  }
}
