import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { Subdivision } from './subdivision'
import { DataSet } from '../core/dataSet'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import { Country } from './country'
import { data } from '../core/db'
import Joi from 'joi'

export class City extends sdk.Models.City implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): City {
    if (!row.data.code)
      throw new Error(`[cities.csv] Line ${row.line} is missing the required "code" column`)
    if (!row.data.name)
      throw new Error(`[cities.csv] Line ${row.line} is missing the required "name" column`)
    if (!row.data.country)
      throw new Error(`[cities.csv] Line ${row.line} is missing the required "country" column`)
    if (!row.data.wikidata_id)
      throw new Error(`[cities.csv] Line ${row.line} is missing the required "wikidata_id" column`)

    const city = new City({
      code: row.data.code.toString(),
      name: row.data.name.toString(),
      country: row.data.country.toString(),
      subdivision: row.data.subdivision ? row.data.subdivision.toString() : null,
      wikidata_id: row.data.wikidata_id.toString()
    })

    city.line = row.line

    return city
  }

  update(dataSet: DataSet): this {
    const data = {
      name: dataSet.getString('city_name'),
      country: dataSet.getString('country'),
      subdivision: dataSet.getString('subdivision'),
      wikidata_id: dataSet.getString('wikidata_id')
    }

    if (data.name !== undefined) this.name = data.name
    if (data.country !== undefined) this.country = data.country
    if (data.subdivision !== undefined) this.subdivision = data.subdivision
    if (data.wikidata_id !== undefined) this.wikidata_id = data.wikidata_id

    return this
  }

  hasValidCountryCode(countriesKeyByCode: Dictionary<Country>) {
    return countriesKeyByCode.has(this.country)
  }

  hasValidSubdivisionCode(subdivisionsKeyByCode: Dictionary<Subdivision>) {
    if (!this.subdivision) return true

    return subdivisionsKeyByCode.has(this.subdivision)
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

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return {
      country: this.country,
      subdivision: this.subdivision || '',
      code: this.code,
      name: this.name,
      wikidata_id: this.wikidata_id
    }
  }

  validate(): Collection<ValidatorError> {
    const { countriesKeyByCode, subdivisionsKeyByCode } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({
          line: this.line,
          message: `${this.code}: ${detail.message}`
        })
      })
    }

    if (!this.hasValidCountryCode(countriesKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.code}" has an invalid country "${this.country}"`
      })
    }

    if (!this.hasValidSubdivisionCode(subdivisionsKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.code}" has an invalid subdivision "${this.subdivision}"`
      })
    }

    return errors
  }
}
