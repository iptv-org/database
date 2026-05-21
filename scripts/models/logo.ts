import { Validator, ValidatorError } from '../types/validator'
import { IssueData } from '../models/issueData'
import { Collection } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import { data } from '../core/db'
import Joi from 'joi'

export class Logo extends sdk.Models.Logo implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Logo {
    if (!row.data.channel) throw new Error('Logo: "channel" not specified')
    if (!row.data.url) throw new Error('Logo: "url" not specified')

    const logo = new Logo({
      channel: row.data.channel.toString(),
      feed: row.data.feed ? row.data.feed.toString() : null,
      in_use: row.data.in_use === false ? row.data.in_use : true,
      url: row.data.url.toString(),
      tags: Array.isArray(row.data.tags) ? row.data.tags : [],
      width: typeof row.data.width === 'number' ? row.data.width : 0,
      height: typeof row.data.height === 'number' ? row.data.height : 0,
      format: row.data.format ? row.data.format.toString() : null
    })

    logo.line = row.line

    return logo
  }

  update(issueData: IssueData): this {
    const data = {
      channel: issueData.getString('new_channel_id'),
      feed: issueData.getString('new_feed_id'),
      in_use: issueData.getBoolean('in_use'),
      tags: issueData.getArray('tags'),
      width: issueData.getNumber('width'),
      height: issueData.getNumber('height'),
      format: issueData.getString('format')
    }

    if (data.channel !== undefined) this.channel = data.channel
    if (data.feed !== undefined) this.feed = data.feed
    if (data.in_use !== undefined) this.in_use = data.in_use
    if (data.tags !== undefined) this.tags = data.tags
    if (data.width !== undefined) this.width = data.width
    if (data.height !== undefined) this.height = data.height
    if (data.format !== undefined) this.format = data.format

    return this
  }

  hasValidChannelId(): boolean {
    return data.channelsKeyById.has(this.channel)
  }

  hasValidFeedId(): boolean {
    return this.feed ? data.feedsKeyByStreamId.has(this.getStreamId()) : true
  }

  getSchema() {
    return Joi.object({
      channel: Joi.string()
        .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
        .required(),
      feed: Joi.string()
        .regex(/^[A-Za-z0-9]+$/)
        .allow(null),
      in_use: Joi.boolean().strict().required(),
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

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return {
      channel: this.channel,
      feed: this.feed || '',
      in_use: this.in_use,
      tags: this.tags,
      width: typeof this.width === 'number' ? this.width.toString() : '',
      height: typeof this.height === 'number' ? this.height.toString() : '',
      format: this.format || '',
      url: this.url
    }
  }

  override toObject(): sdk.Types.LogoData & { in_use: boolean } {
    return { ...super.toObject(), in_use: this.in_use }
  }

  validate(): Collection<ValidatorError> {
    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: this.line, message: `${this.url}: ${detail.message}` })
      })
    }

    if (!this.hasValidChannelId()) {
      errors.add({
        line: this.line,
        message: `Channel with id "${this.channel}" is missing from the channels.csv`
      })
    }

    if (!this.hasValidFeedId()) {
      errors.add({
        line: this.line,
        message: `Feed with channel "${this.channel}" and id "${this.feed}" is missing from the feeds.csv`
      })
    }

    return errors
  }
}
