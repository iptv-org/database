import { Dictionary } from '@freearhey/core'
import { CityData } from '../types/city'
import { IssueData } from '../core'
import { Model } from './model'
import Joi from 'joi'
import { Subdivision } from './subdivision'

export class City extends Model {
  code: string
  name: string
  countryCode: string
  subdivisionCode?: string
  subdivision?: Subdivision
  wikidataId: string

  constructor(data: CityData) {
    super()

    this.code = data.code
    this.name = data.name
    this.countryCode = data.country
    this.subdivisionCode = data.subdivision || undefined
    this.wikidataId = data.wikidata_id
  }

  withSubdivision(subdivisionsKeyByCode: Dictionary): this {
    if (!this.subdivisionCode) return this

    this.subdivision = subdivisionsKeyByCode.get(this.subdivisionCode)

    return this
  }

  hasValidCountryCode(countriesKeyByCode: Dictionary) {
    return countriesKeyByCode.has(this.countryCode)
  }

  hasValidSubdivisionCode(subdivisionsKeyByCode: Dictionary) {
    if (!this.subdivisionCode) return true

    return subdivisionsKeyByCode.has(this.subdivisionCode)
  }

  update(issueData: IssueData): this {
    const data = {
      name: issueData.getString('city_name'),
      country: issueData.getString('country'),
      subdivision: issueData.getString('subdivision'),
      wikidata_id: issueData.getString('wikidata_id')
    }

    if (data.name !== undefined) this.name = data.name
    if (data.country !== undefined) this.countryCode = data.country
    if (data.subdivision !== undefined) this.subdivisionCode = data.subdivision
    if (data.wikidata_id !== undefined) this.wikidataId = data.wikidata_id

    return this
  }

  data(): CityData {
    return {
      country: this.countryCode,
      subdivision: this.subdivisionCode || null,
      code: this.code,
      name: this.name,
      wikidata_id: this.wikidataId
    }
  }

  getSchema() {
    return Joi.object({
      country: Joi.string()
        .regex(/^[A-Z]{2}$/)
        .required(),
      subdivision: Joi.string()
        .regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)
        .allow(null),
      name: Joi.string().required(),
      code: Joi.string()
        .regex(
          /(A[D-GILMOQ-UWXZ]|B[ABIE-HDJLM-OQR-TWYZ]|C[ACDF-IK-ORU-Z]|D[EJKMOZ]|E[CEGHRST]|F[I-KMOR]|JE|G[ABD-IL-UWY]|H[KMNRTU]|I[DELMNOQRST]|J[MOP]|K[EGHIMNPRWY]|K[YZ]|L[ABCIKR-VY]|M[AC-HKL-Z]|N[ACE-ILO-PRUZ]|OM|[P-Z][A-Z]+)[A-Z0-9]{3}/
        )
        .required(),
      wikidata_id: Joi.string()
        .regex(/^Q\d+$/)
        .required()
    })
  }
}
