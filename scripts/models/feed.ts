import { Collection, Dictionary } from '@freearhey/core'
import { FeedData } from '../types/feed'
import { createFeedId } from '../utils'
import { Model } from './model'
import JoiDate from '@joi/date'
import BaseJoi from 'joi'
import { IssueData } from '../core'

const Joi = BaseJoi.extend(JoiDate)

export class Feed extends Model {
  channelId: string
  id: string
  name: string
  isMain: boolean
  broadcastAreaCodes: Collection
  timezoneIds: Collection
  languageCodes: Collection
  videoFormat?: string

  constructor(data: FeedData) {
    super()

    this.channelId = data.channel
    this.id = data.id
    this.name = data.name
    this.isMain = data.is_main
    this.broadcastAreaCodes = new Collection(data.broadcast_area)
    this.timezoneIds = new Collection(data.timezones)
    this.languageCodes = new Collection(data.languages)
    this.videoFormat = data.video_format
  }

  setId(id: string): this {
    this.id = id

    return this
  }

  update(issueData: IssueData): this {
    const data = {
      feed_name: issueData.getString('feed_name'),
      is_main: issueData.getBoolean('is_main'),
      broadcast_area: issueData.getArray('broadcast_area'),
      timezones: issueData.getArray('timezones'),
      languages: issueData.getArray('languages'),
      video_format: issueData.getString('video_format')
    }

    if (data.feed_name !== undefined) this.name = data.feed_name
    if (data.is_main !== undefined) this.isMain = data.is_main
    if (data.broadcast_area !== undefined)
      this.broadcastAreaCodes = new Collection(data.broadcast_area)
    if (data.timezones !== undefined) this.timezoneIds = new Collection(data.timezones)
    if (data.languages !== undefined) this.languageCodes = new Collection(data.languages)
    if (data.video_format !== undefined) this.videoFormat = data.video_format

    return this
  }

  hasValidId(): boolean {
    const expectedId = createFeedId(this.name)

    return expectedId === this.id
  }

  hasValidChannelId(channelsKeyById: Dictionary): boolean {
    return channelsKeyById.has(this.channelId)
  }

  hasValidTimezones(timezonesKeyById: Dictionary): boolean {
    const hasInvalid = this.timezoneIds.find((id: string) => timezonesKeyById.missing(id))

    return !hasInvalid
  }

  hasValidBroadcastAreaCodes(
    countriesKeyByCode: Dictionary,
    subdivisionsKeyByCode: Dictionary,
    regionsKeyByCode: Dictionary
  ): boolean {
    const hasInvalid = this.broadcastAreaCodes.find((areaCode: string) => {
      const [type, code] = areaCode.split('/')
      switch (type) {
        case 'c':
          return countriesKeyByCode.missing(code)
        case 's':
          return subdivisionsKeyByCode.missing(code)
        case 'r':
          return regionsKeyByCode.missing(code)
      }
    })

    return !hasInvalid
  }

  getStreamId(): string {
    return `${this.channelId}@${this.id}`
  }

  data(): FeedData {
    return {
      channel: this.channelId,
      id: this.id,
      name: this.name,
      is_main: this.isMain,
      broadcast_area: this.broadcastAreaCodes.all(),
      timezones: this.timezoneIds.all(),
      languages: this.languageCodes.all(),
      video_format: this.videoFormat
    }
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
      is_main: Joi.boolean().strict().required(),
      broadcast_area: Joi.array().items(
        Joi.string()
          .regex(/^(s\/[A-Z]{2}-[A-Z0-9]{1,3}|c\/[A-Z]{2}|r\/[A-Z0-9]{2,7})$/)
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
      video_format: Joi.string()
        .regex(/^\d+(i|p)$/)
        .allow(null)
    })
  }
}
