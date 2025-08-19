import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Feed } from '../models'
import { DataLoaderData } from '../types/dataLoader'

export class FeedValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(feed: Feed): Collection {
    const {
      channelsKeyById,
      countriesKeyByCode,
      subdivisionsKeyByCode,
      regionsKeyByCode,
      timezonesKeyById,
      citiesKeyByCode
    }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = feed.getSchema().validate(feed.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: feed.getLine(), message: `${feed.getStreamId()}: ${detail.message}` })
      })
    }

    if (!feed.hasValidId()) {
      errors.add({
        line: feed.getLine(),
        message: `"${feed.getStreamId()}" id "${feed.id}" must be derived from the name "${
          feed.name
        }"`
      })
    }

    if (!feed.hasValidChannelId(channelsKeyById)) {
      errors.add({
        line: feed.getLine(),
        message: `"${feed.getStreamId()}" has the wrong channel "${feed.channelId}"`
      })
    }

    if (
      !feed.hasValidBroadcastAreaCodes(
        countriesKeyByCode,
        subdivisionsKeyByCode,
        regionsKeyByCode,
        citiesKeyByCode
      )
    ) {
      errors.add({
        line: feed.getLine(),
        message: `"${feed.getStreamId()}" has the wrong broadcast_area "${feed.broadcastAreaCodes.join(
          ';'
        )}"`
      })
    }

    if (!feed.hasValidTimezones(timezonesKeyById)) {
      errors.add({
        line: feed.getLine(),
        message: `"${feed.getStreamId()}" has the wrong timezones "${feed.timezoneIds.join(';')}"`
      })
    }

    return errors
  }
}
