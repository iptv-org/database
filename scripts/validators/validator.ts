import { ValidatorProps } from '../types/validator'
import { DataLoaderData } from '../types/dataLoader'

export class Validator {
  data: DataLoaderData

  constructor({ data }: ValidatorProps) {
    this.data = data
  }
}
