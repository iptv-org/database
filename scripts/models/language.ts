import { LanguageData } from '../types/language'
import { Model } from './model'
import Joi from 'joi'

export class Language extends Model {
  code: string
  name: string

  constructor(data: LanguageData) {
    super()

    this.code = data.code
    this.name = data.name
  }

  data(): LanguageData {
    return {
      code: this.code,
      name: this.name
    }
  }

  getSchema() {
    return Joi.object({
      code: Joi.string()
        .regex(/^[a-z]{3}$/)
        .required(),
      name: Joi.string().required()
    })
  }
}
