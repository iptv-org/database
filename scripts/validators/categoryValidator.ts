import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Category } from '../models'

export class CategoryValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(category: Category): Collection {
    const errors = new Collection()

    const joiResults = category.getSchema().validate(category.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: category.getLine(), message: `${category.id}: ${detail.message}` })
      })
    }

    return errors
  }
}
