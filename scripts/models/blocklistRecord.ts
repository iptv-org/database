import { BlocklistRecordData } from '../types/blocklistRecord'
import { Dictionary } from '@freearhey/core'
import { Model } from './model'
import Joi from 'joi'

export class BlocklistRecord extends Model {
  channelId: string
  reason: string
  ref: string

  constructor(data: BlocklistRecordData) {
    super()

    this.channelId = data.channel
    this.reason = data.reason
    this.ref = data.ref
  }

  hasValidChannelId(channelsKeyById: Dictionary): boolean {
    return channelsKeyById.has(this.channelId)
  }

  data(): BlocklistRecordData {
    return {
      channel: this.channelId,
      reason: this.reason,
      ref: this.ref
    }
  }

  getSchema() {
    return Joi.object({
      channel: Joi.string()
        .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
        .required(),
      reason: Joi.string()
        .valid(...['dmca', 'nsfw'])
        .required(),
      ref: Joi.string().uri().required()
    })
  }
}
