import { SubdivisionData } from '../types/subdivision'
import { Dictionary } from '@freearhey/core'
import { Model } from './model'
import Joi from 'joi'

export class Subdivision extends Model {
  code: string
  name: string
  countryCode: string

  constructor(data: SubdivisionData) {
    super()

    this.code = data.code
    this.name = data.name
    this.countryCode = data.country
  }

  hasValidCountryCode(countriesKeyByCode: Dictionary): boolean {
    return countriesKeyByCode.has(this.countryCode)
  }

  data(): SubdivisionData {
    return {
      code: this.code,
      name: this.name,
      country: this.countryCode
    }
  }

  getSchema() {
    return Joi.object({
      country: Joi.string()
        .regex(/^[A-Z]{2}$/)
        .required(),
      name: Joi.string().required(),
      code: Joi.string()
        .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
        .required()
    })
  }
}
