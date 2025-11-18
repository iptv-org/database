import { Validator, ValidatorError } from '../types/validator'
import { Collection } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import Joi from 'joi'

export class Category extends sdk.Models.Category implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Category {
    if (!row.data.id) throw new Error('Category: "id" not specified')
    if (!row.data.name) throw new Error('Category: "name" not specified')
    if (!row.data.description) throw new Error('Category: "description" not specified')

    const category = new Category({
      id: row.data.id.toString(),
      name: row.data.name.toString(),
      description: row.data.description.toString()
    })

    category.line = row.line

    return category
  }

  getSchema() {
    return Joi.object({
      id: Joi.string()
        .regex(/^[a-z]+$/)
        .required(),
      name: Joi.string()
        .regex(/^[A-Z]+$/i)
        .required(),
      description: Joi.string().required()
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
        errors.add({ line: this.line, message: `${this.id}: ${detail.message}` })
      })
    }

    return errors
  }
}
