import { Collection, Dictionary } from '@freearhey/core'
import { CountryData } from '../types/country'
import { Model } from './model'
import Joi from 'joi'

export class Country extends Model {
  code: string
  name: string
  flagEmoji: string
  languageCodes: Collection

  constructor(data: CountryData) {
    super()

    this.code = data.code
    this.name = data.name
    this.flagEmoji = data.flag
    this.languageCodes = new Collection(data.languages)
  }

  hasValidLanguageCodes(languagesKeyByCode: Dictionary): boolean {
    const hasInvalid = this.languageCodes.find((code: string) => languagesKeyByCode.missing(code))

    return !hasInvalid
  }

  data(): CountryData {
    return {
      code: this.code,
      name: this.name,
      flag: this.flagEmoji,
      languages: this.languageCodes.all()
    }
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
}
