import { Collection, Dictionary } from '@freearhey/core'
import { TimezoneData } from '../types/timezone'
import { Model } from './model'
import Joi from 'joi'

export class Timezone extends Model {
  id: string
  utcOffset: string
  countryCodes: Collection

  constructor(data: TimezoneData) {
    super()

    this.id = data.id
    this.utcOffset = data.utc_offset
    this.countryCodes = new Collection(data.countries)
  }

  hasValidCountryCodes(countriesKeyByCode: Dictionary): boolean {
    const hasInvalid = this.countryCodes.find((code: string) => countriesKeyByCode.missing(code))

    return !hasInvalid
  }

  data(): TimezoneData {
    return {
      id: this.id,
      utc_offset: this.utcOffset,
      countries: this.countryCodes.all()
    }
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
}
