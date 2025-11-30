import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { createFeedId, data } from '../core'
import { Subdivision } from './subdivision'
import { IssueData } from './issueData'
import { CSVRow } from '../types/utils'
import { Timezone } from './timezone'
import * as sdk from '@iptv-org/sdk'
import { Channel } from './channel'
import { Country } from './country'
import { Region } from './region'
import JoiDate from '@joi/date'
import { City } from './city'
import BaseJoi from 'joi'

const Joi = BaseJoi.extend(JoiDate)

export class Feed extends sdk.Models.Feed implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Feed {
    if (!row.data.channel) throw new Error('Feed: "channel" not specified')
    if (!row.data.id) throw new Error('Feed: "id" not specified')
    if (!row.data.name) throw new Error('Feed: "name" not specified')
    if (!row.data.format) throw new Error('Feed: "format" not specified')

    const feed = new Feed({
      channel: row.data.channel.toString(),
      id: row.data.id.toString(),
      name: row.data.name.toString(),
      alt_names: Array.isArray(row.data.alt_names) ? row.data.alt_names : [],
      is_main: !!row.data.is_main,
      broadcast_area: Array.isArray(row.data.broadcast_area) ? row.data.broadcast_area : [],
      timezones: Array.isArray(row.data.timezones) ? row.data.timezones : [],
      languages: Array.isArray(row.data.languages) ? row.data.languages : [],
      format: row.data.format.toString()
    })

    feed.line = row.line

    return feed
  }

  update(issueData: IssueData): this {
    const data = {
      feed_name: issueData.getString('feed_name'),
      alt_names: issueData.getArray('alt_names'),
      is_main: issueData.getBoolean('is_main'),
      broadcast_area: issueData.getArray('broadcast_area'),
      timezones: issueData.getArray('timezones'),
      languages: issueData.getArray('languages'),
      format: issueData.getString('format')
    }

    if (data.feed_name !== undefined) this.name = data.feed_name
    if (data.alt_names !== undefined) this.alt_names = data.alt_names
    if (data.is_main !== undefined) this.is_main = data.is_main
    if (data.broadcast_area !== undefined) this.broadcast_area = data.broadcast_area
    if (data.timezones !== undefined) this.timezones = data.timezones
    if (data.languages !== undefined) this.languages = data.languages
    if (data.format !== undefined) this.format = data.format

    const newFeedName = issueData.getString('feed_name')
    if (newFeedName) {
      this.id = createFeedId(newFeedName)
    }

    return this
  }

  hasValidId(): boolean {
    const expectedId = createFeedId(this.name)

    return expectedId === this.id
  }

  hasValidChannelId(channelsKeyById: Dictionary<Channel>): boolean {
    return channelsKeyById.has(this.channel)
  }

  hasValidTimezones(timezonesKeyById: Dictionary<Timezone>): boolean {
    const hasInvalid = this.timezones.find((id: string) => timezonesKeyById.missing(id))

    return !hasInvalid
  }

  hasValidBroadcastAreaCodes(
    countriesKeyByCode: Dictionary<Country>,
    subdivisionsKeyByCode: Dictionary<Subdivision>,
    regionsKeyByCode: Dictionary<Region>,
    citiesKeyByCode: Dictionary<City>
  ): boolean {
    const hasInvalid = this.broadcast_area.find((areaCode: string) => {
      const [type, code] = areaCode.split('/')
      switch (type) {
        case 'c':
          return countriesKeyByCode.missing(code)
        case 's':
          return subdivisionsKeyByCode.missing(code)
        case 'r':
          return regionsKeyByCode.missing(code)
        case 'ct':
          return citiesKeyByCode.missing(code)
      }
    })

    return !hasInvalid
  }

  getSchema() {
    return Joi.object({
      channel: Joi.string()
        .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
        .required(),
      id: Joi.string()
        .regex(/^[A-Za-z0-9]+$/)
        .required(),
      name: Joi.string()
        .regex(/^[a-z0-9-!:&.+'/»#%°$@?|¡–\s_—]+$/i)
        .regex(/^((?!\s-\s).)*$/)
        .required(),
      alt_names: Joi.array().items(
        Joi.string()
          .regex(/^[^",]+$/)
          .invalid(Joi.ref('name'))
      ),
      is_main: Joi.boolean().strict().required(),
      broadcast_area: Joi.array().items(
        Joi.string()
          .regex(/^(s\/[A-Z]{2}-[A-Z0-9]{1,3}|c\/[A-Z]{2}|r\/[A-Z0-9]{2,7}|ct\/[A-Z0-9]{5})$/)
          .required()
      ),
      timezones: Joi.array().items(
        Joi.string()
          .regex(/^[a-z-_/]+$/i)
          .required()
      ),
      languages: Joi.array().items(
        Joi.string()
          .regex(/^[a-z]{3}$/)
          .required()
      ),
      format: Joi.string()
        .regex(/^\d+(i|p)$/)
        .allow(null)
    })
  }

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return {
      channel: this.channel,
      id: this.id,
      name: this.name,
      alt_names: this.alt_names,
      is_main: this.is_main,
      broadcast_area: this.broadcast_area,
      timezones: this.timezones,
      languages: this.languages,
      format: this.format
    }
  }

  validate(): Collection<ValidatorError> {
    const {
      channelsKeyById,
      countriesKeyByCode,
      subdivisionsKeyByCode,
      regionsKeyByCode,
      timezonesKeyById,
      citiesKeyByCode
    } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: this.line, message: `${this.getStreamId()}: ${detail.message}` })
      })
    }

    if (!this.hasValidId()) {
      errors.add({
        line: this.line,
        message: `"${this.getStreamId()}" id "${this.id}" must be derived from the name "${
          this.name
        }"`
      })
    }

    if (!this.hasValidChannelId(channelsKeyById)) {
      errors.add({
        line: this.line,
        message: `"${this.getStreamId()}" has the wrong channel "${this.channel}"`
      })
    }

    if (
      !this.hasValidBroadcastAreaCodes(
        countriesKeyByCode,
        subdivisionsKeyByCode,
        regionsKeyByCode,
        citiesKeyByCode
      )
    ) {
      errors.add({
        line: this.line,
        message: `"${this.getStreamId()}" has the wrong broadcast_area "${this.broadcast_area.join(
          ';'
        )}"`
      })
    }

    if (!this.hasValidTimezones(timezonesKeyById)) {
      errors.add({
        line: this.line,
        message: `"${this.getStreamId()}" has the wrong timezones "${this.timezones.join(';')}"`
      })
    }

    return errors
  }
}
