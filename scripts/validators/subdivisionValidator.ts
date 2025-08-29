import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Subdivision } from '../models'
import { DataLoaderData } from '../types/dataLoader'

export class SubdivisionValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(subdivision: Subdivision): Collection {
    const { countriesKeyByCode, subdivisionsKeyByCode }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = subdivision.getSchema().validate(subdivision.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({
          line: subdivision.getLine(),
          message: `${subdivision.code}: ${detail.message}`
        })
      })
    }

    if (!subdivision.hasValidCountryCode(countriesKeyByCode)) {
      errors.add({
        line: subdivision.getLine(),
        message: `"${subdivision.code}" has an invalid country "${subdivision.countryCode}"`
      })
    }

    if (!subdivision.hasValidParent(subdivisionsKeyByCode)) {
      errors.add({
        line: subdivision.getLine(),
        message: `"${subdivision.code}" has an invalid parent "${subdivision.parentCode}"`
      })
    }

    return errors
  }
}
