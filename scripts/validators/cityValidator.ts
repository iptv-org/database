import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { City } from '../models'
import { DataLoaderData } from '../types/dataLoader'

export class CityValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(city: City): Collection {
    const { countriesKeyByCode, subdivisionsKeyByCode }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = city.getSchema().validate(city.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({
          line: city.getLine(),
          message: `${city.code}: ${detail.message}`
        })
      })
    }

    if (!city.hasValidCountryCode(countriesKeyByCode)) {
      errors.add({
        line: city.getLine(),
        message: `"${city.code}" has an invalid country "${city.countryCode}"`
      })
    }

    if (!city.hasValidSubdivisionCode(subdivisionsKeyByCode)) {
      errors.add({
        line: city.getLine(),
        message: `"${city.code}" has an invalid subdivision "${city.subdivisionCode}"`
      })
    }

    return errors
  }
}
