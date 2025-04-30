import { CategoryData } from '../types/category'
import { Model } from './model'
import Joi from 'joi'

export class Category extends Model {
  id: string
  name: string

  constructor(data: CategoryData) {
    super()

    this.id = data.id
    this.name = data.name
  }

  data(): CategoryData {
    return {
      id: this.id,
      name: this.name
    }
  }

  getSchema() {
    return Joi.object({
      id: Joi.string()
        .regex(/^[a-z]+$/)
        .required(),
      name: Joi.string()
        .regex(/^[A-Z]+$/i)
        .required()
    })
  }
}
