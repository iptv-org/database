import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Country } from '../models'
import { DataLoaderData } from '../types/dataLoader'

export class CountryValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(country: Country): Collection {
    const { languagesKeyByCode }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = country.getSchema().validate(country.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: country.getLine(), message: `${country.code}: ${detail.message}` })
      })
    }

    if (!country.hasValidLanguageCodes(languagesKeyByCode)) {
      errors.add({
        line: country.getLine(),
        message: `"${country.code}" has an invalid languages "${country.languageCodes.join(';')}"`
      })
    }

    return errors
  }
}
