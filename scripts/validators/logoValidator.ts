import { DataLoaderData } from '../types/dataLoader'
import { ValidatorProps } from '../types/validator'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Logo } from '../models'

export class LogoValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(logo: Logo): Collection {
    const { channelsKeyById, feedsKeyById }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = logo.getSchema().validate(logo.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: logo.getLine(), message: `${logo.url}: ${detail.message}` })
      })
    }

    if (!logo.hasValidChannelId(channelsKeyById)) {
      errors.add({
        line: logo.getLine(),
        message: `"${logo.channelId}" is missing from the channels.csv`
      })
    }

    if (!logo.hasValidFeedId(feedsKeyById)) {
      errors.add({
        line: logo.getLine(),
        message: `"${logo.feedId}" is missing from the feeds.csv`
      })
    }

    return errors
  }
}
