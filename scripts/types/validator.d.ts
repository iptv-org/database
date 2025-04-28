import { DataLoaderData } from './dataLoader'

export type ValidatorError = {
  line: number
  message: string
}

export type ValidatorProps = {
  data: DataLoaderData
}
