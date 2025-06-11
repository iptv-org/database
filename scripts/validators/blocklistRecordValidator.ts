import { DataLoaderData } from '../types/dataLoader'
import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { BlocklistRecord } from '../models'

export class BlocklistRecordValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(blocklistRecord: BlocklistRecord): Collection {
    const { channelsKeyById }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = blocklistRecord
      .getSchema()
      .validate(blocklistRecord.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({
          line: blocklistRecord.getLine(),
          message: `${blocklistRecord.channelId}: ${detail.message}`
        })
      })
    }

    if (!blocklistRecord.hasValidChannelId(channelsKeyById)) {
      errors.add({
        line: blocklistRecord.getLine(),
        message: `"${blocklistRecord.channelId}" is missing from the channels.csv`
      })
    }

    return errors
  }
}
