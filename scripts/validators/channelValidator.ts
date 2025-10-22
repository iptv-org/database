import { ValidatorProps } from '../types/validator'
import { DataLoaderData } from '../types/dataLoader'
import { Collection } from '@freearhey/core'
import { Validator } from './validator'
import { Channel } from '../models'

export class ChannelValidator extends Validator {
  constructor(props: ValidatorProps) {
    super(props)
  }

  validate(channel: Channel): Collection {
    const {
      channelsKeyById,
      feedsKeyByStreamId,
      countriesKeyByCode,
      subdivisionsKeyByCode,
      categoriesKeyById
    }: DataLoaderData = this.data

    const errors = new Collection()

    const joiResults = channel.getSchema().validate(channel.data(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: channel.getLine(), message: `${channel.id}: ${detail.message}` })
      })
    }

    if (!channel.hasValidId()) {
      errors.add({
        line: channel.getLine(),
        message: `"${channel.id}" must be derived from the channel name "${channel.name}" and the country code "${channel.countryCode}"`
      })
    }

    if (!channel.hasMainFeed()) {
      errors.add({
        line: channel.getLine(),
        message: `"${channel.id}" does not have a main feed`
      })
    }

    if (channel.hasMoreThanOneMainFeed()) {
      errors.add({
        line: channel.getLine(),
        message: `"${channel.id}" has more than one main feed`
      })
    }

    if (!channel.hasValidReplacedBy(channelsKeyById, feedsKeyByStreamId)) {
      errors.add({
        line: channel.getLine(),
        message: `"${channel.id}" has an invalid replaced_by "${channel.replacedBy}"`
      })
    }

    if (!channel.hasValidCountryCode(countriesKeyByCode)) {
      errors.add({
        line: channel.getLine(),
        message: `"${channel.id}" has an invalid country "${channel.countryCode}"`
      })
    }

    if (!channel.hasValidCategoryIds(categoriesKeyById)) {
      errors.add({
        line: channel.getLine(),
        message: `"${channel.id}" has an invalid categories "${channel.getCategoryIds().join(';')}"`
      })
    }

    return errors
  }
}
