import { Collection, Dictionary } from '@freearhey/core'
import { IssueData } from '../core/issueData'
import { LogoData } from '../types/logo'
import { Model } from './model'
import Joi from 'joi'

export class Logo extends Model {
  channelId: string
  feedId?: string
  tags: Collection
  width: number
  height: number
  format: string
  url: string

  constructor(data: LogoData) {
    super()

    this.channelId = data.channel
    this.feedId = data.feed
    this.tags = new Collection(data.tags)
    this.width = data.width
    this.height = data.height
    this.format = data.format
    this.url = data.url
  }

  hasValidChannelId(channelsKeyById: Dictionary): boolean {
    return channelsKeyById.has(this.channelId)
  }

  hasValidFeedId(feedKeyById: Dictionary): boolean {
    return this.feedId ? feedKeyById.has(this.feedId) : true
  }

  update(issueData: IssueData): this {
    const data = {
      new_channel_id: issueData.getString('new_channel_id'),
      new_feed_id: issueData.getString('new_feed_id'),
      new_logo_url: issueData.getString('new_logo_url'),
      tags: issueData.getArray('tags')
    }

    if (data.new_channel_id !== undefined) this.channelId = data.new_channel_id
    if (data.new_feed_id !== undefined) this.feedId = data.new_feed_id
    if (data.new_logo_url !== undefined) this.url = data.new_logo_url
    if (data.tags !== undefined) this.tags = new Collection(data.tags)

    return this
  }

  setWidth(width: number): this {
    this.width = width

    return this
  }

  setHeight(height: number): this {
    this.height = height

    return this
  }

  setFormat(format: string): this {
    this.format = format

    return this
  }

  data(): LogoData {
    return {
      channel: this.channelId,
      feed: this.feedId,
      tags: this.tags.all(),
      width: this.width,
      height: this.height,
      format: this.format,
      url: this.url
    }
  }

  getSchema() {
    return Joi.object({
      channel: Joi.string()
        .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
        .required(),
      feed: Joi.string()
        .regex(/^[A-Za-z0-9]+$/)
        .allow(null),
      tags: Joi.array().items(Joi.string().regex(/^[a-z0-9-]+$/i)),
      width: Joi.number().required(),
      height: Joi.number().required(),
      format: Joi.string().valid('SVG', 'PNG', 'JPEG', 'GIF', 'WebP', 'AVIF', 'APNG').allow(null),
      url: Joi.string()
        .regex(/,/, { invert: true })
        .uri({
          scheme: ['https']
        })
        .required()
    })
  }
}
