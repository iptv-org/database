import { Collection, Dictionary } from '@freearhey/core'
import { RegionData } from '../types/region'
import { Model } from './model'
import Joi from 'joi'

export class Region extends Model {
  code: string
  name: string
  countryCodes: Collection

  constructor(data: RegionData) {
    super()

    this.code = data.code
    this.name = data.name
    this.countryCodes = new Collection(data.countries)
  }

  hasValidCountryCodes(countriesKeyByCode: Dictionary): boolean {
    const hasInvalid = this.countryCodes.find((code: string) => countriesKeyByCode.missing(code))

    return !hasInvalid
  }

  data(): RegionData {
    return {
      code: this.code,
      name: this.name,
      countries: this.countryCodes.all()
    }
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
}
