import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { CSVRow } from '../types/utils'
import * as sdk from '@iptv-org/sdk'
import { Channel } from './channel'
import { data } from '../core/db'
import Joi from 'joi'

export class BlocklistRecord extends sdk.Models.BlocklistRecord implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): BlocklistRecord {
    if (!row.data.channel) throw new Error('BlocklistRecord: "channel" not specified')
    if (!row.data.reason) throw new Error('BlocklistRecord: "reason" not specified')
    if (!row.data.ref) throw new Error('BlocklistRecord: "ref" not specified')

    const record = new BlocklistRecord({
      channel: row.data.channel.toString(),
      reason: row.data.reason.toString(),
      ref: row.data.ref.toString()
    })

    record.line = row.line

    return record
  }

  hasValidChannelId(channelsKeyById: Dictionary<Channel>): boolean {
    return channelsKeyById.has(this.channel)
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

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return this.toObject() as Record<string, string | string[] | boolean>
  }

  validate(): Collection<ValidatorError> {
    const { channelsKeyById } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({
          line: this.line,
          message: `${this.channel}: ${detail.message}`
        })
      })
    }

    if (!this.hasValidChannelId(channelsKeyById)) {
      errors.add({
        line: this.line,
        message: `"${this.channel}" is missing from the channels.csv`
      })
    }

    return errors
  }
}
