import { DataLoaderData } from '../types/dataLoader'
import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Region } from '../models'

export class RegionValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(region: Region): Collection {
    const { countriesKeyByCode }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = region.getSchema().validate(region.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: region.getLine(), message: `${region.code}: ${detail.message}` })
      })
    }

    if (!region.hasValidCountryCodes(countriesKeyByCode)) {
      errors.add({
        line: region.getLine(),
        message: `"${region.code}" has the wrong countries "${region.countryCodes.join(';')}"`
      })
    }

    return errors
  }
}
