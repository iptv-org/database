import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Language } from '../models'

export class LanguageValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(language: Language): Collection {
    const errors = new Collection()

    const joiResults = language.getSchema().validate(language.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: language.getLine(), message: `${language.code}: ${detail.message}` })
      })
    }

    return errors
  }
}
