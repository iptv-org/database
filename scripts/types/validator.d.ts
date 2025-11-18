import { Collection } from '@freearhey/core'

export type ValidatorError = {
  line: number
  message: string
}

export interface Validator {
  validate(): Collection<ValidatorError>
}
