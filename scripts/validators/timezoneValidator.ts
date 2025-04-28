import { DataLoaderData } from '../types/dataLoader'
import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Timezone } from '../models'

export class TimezoneValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(timezone: Timezone): Collection {
    const { countriesKeyByCode }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = timezone.getSchema().validate(timezone.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: timezone.getLine(), message: `${timezone.id}: ${detail.message}` })
      })
    }

    if (!timezone.hasValidCountryCodes(countriesKeyByCode)) {
      errors.add({
        line: timezone.getLine(),
        message: `"${timezone.id}" has the wrong countries "${timezone.countryCodes.join(';')}"`
      })
    }

    return errors
  }
}
