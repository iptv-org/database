import { Validator, ValidatorError } from '../types/validator'
import { Collection, Dictionary } from '@freearhey/core'
import { createChannelId, data } from '../core'
import { IssueData } from './issueData'
import { CSVRow } from '../types/utils'
import { Category } from './category'
import * as sdk from '@iptv-org/sdk'
import { Country } from './country'
import JoiDate from '@joi/date'
import { Feed } from './feed'
import BaseJoi from 'joi'

const Joi = BaseJoi.extend(JoiDate)

export class Channel extends sdk.Models.Channel implements Validator {
  line: number = -1

  static fromRow(row: CSVRow): Channel {
    if (!row.data.id) throw new Error('Channel: "id" not specified')
    if (!row.data.name) throw new Error('Channel: "name" not specified')
    if (!row.data.country) throw new Error('Channel: "country" not specified')

    const channel = new Channel({
      id: row.data.id.toString(),
      name: row.data.name.toString(),
      alt_names: Array.isArray(row.data.alt_names) ? row.data.alt_names : [],
      network: row.data.network ? row.data.network.toString() : null,
      owners: Array.isArray(row.data.owners) ? row.data.owners : [],
      country: row.data.country.toString(),
      categories: Array.isArray(row.data.categories) ? row.data.categories : [],
      is_nsfw: !!row.data.is_nsfw,
      launched: row.data.launched ? row.data.launched.toString() : null,
      closed: row.data.closed ? row.data.closed.toString() : null,
      replaced_by: row.data.replaced_by ? row.data.replaced_by.toString() : null,
      website: row.data.website ? row.data.website.toString() : null
    })

    channel.line = row.line

    return channel
  }

  update(issueData: IssueData): this {
    const data = {
      channel_name: issueData.getString('channel_name'),
      alt_names: issueData.getArray('alt_names'),
      network: issueData.getString('network'),
      owners: issueData.getArray('owners'),
      country: issueData.getString('country'),
      categories: issueData.getArray('categories'),
      is_nsfw: issueData.getBoolean('is_nsfw'),
      launched: issueData.getString('launched'),
      closed: issueData.getString('closed'),
      replaced_by: issueData.getString('replaced_by'),
      website: issueData.getString('website')
    }

    if (data.channel_name !== undefined) this.name = data.channel_name
    if (data.alt_names !== undefined) this.alt_names = data.alt_names
    if (data.network !== undefined) this.network = data.network || null
    if (data.owners !== undefined) this.owners = data.owners
    if (data.country !== undefined) this.country = data.country
    if (data.categories !== undefined) this.categories = data.categories
    if (data.is_nsfw !== undefined) this.is_nsfw = data.is_nsfw
    if (data.launched !== undefined) this.launched = data.launched || null
    if (data.closed !== undefined) this.closed = data.closed || null
    if (data.replaced_by !== undefined) this.replaced_by = data.replaced_by || null
    if (data.website !== undefined) this.website = data.website || null

    let channelName = issueData.getString('channel_name')
    let country = issueData.getString('country')
    if (channelName || country) {
      channelName = channelName || this.name
      country = country || this.country
      if (channelName && country) {
        const newChannelId = createChannelId(channelName, country)
        if (newChannelId) this.id = newChannelId
      }
    }

    return this
  }

  hasValidId(): boolean {
    const expectedId = createChannelId(this.name, this.country)

    return expectedId === this.id
  }

  getFeeds(): Collection<Feed> {
    return new Collection(data.feedsGroupedByChannelId.get(this.id))
  }

  hasMainFeed(): boolean {
    const feeds = this.getFeeds()

    if (feeds.isEmpty()) return false

    const mainFeed = feeds.find((feed: Feed) => feed.is_main)

    return !!mainFeed
  }

  hasMoreThanOneMainFeed(): boolean {
    const mainFeeds = this.getFeeds().filter((feed: Feed) => feed.is_main)

    return mainFeeds.count() > 1
  }

  hasValidReplacedBy(
    channelsKeyById: Dictionary<Channel>,
    feedsKeyByStreamId: Dictionary<Feed>
  ): boolean {
    if (!this.replaced_by) return true

    const [channelId, feedId] = this.replaced_by.split('@')

    if (channelsKeyById.missing(channelId)) return false
    if (feedId && feedsKeyByStreamId.missing(this.replaced_by)) return false

    return true
  }

  hasValidCountryCode(countriesKeyByCode: Dictionary<Country>): boolean {
    return countriesKeyByCode.has(this.country)
  }

  hasValidCategoryIds(categoriesKeyById: Dictionary<Category>): boolean {
    const hasInvalid = this.categories.find((id: string) => categoriesKeyById.missing(id))

    return !hasInvalid
  }

  getSchema() {
    return Joi.object({
      id: Joi.string()
        .regex(/^[A-Za-z0-9]+\.[a-z]{2}$/)
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
      network: Joi.string()
        .regex(/^[^",]+$/)
        .allow(null),
      owners: Joi.array().items(Joi.string().regex(/^[^",]+$/)),
      country: Joi.string()
        .regex(/^[A-Z]{2}$/)
        .required(),
      categories: Joi.array().items(Joi.string().regex(/^[a-z]+$/)),
      is_nsfw: Joi.boolean().strict().required(),
      launched: Joi.date().format('YYYY-MM-DD').raw().allow(null),
      closed: Joi.date().format('YYYY-MM-DD').raw().allow(null).greater(Joi.ref('launched')),
      replaced_by: Joi.string()
        .regex(/^[A-Za-z0-9]+\.[a-z]{2}($|@[A-Za-z0-9]+$)/)
        .allow(null),
      website: Joi.string()
        .regex(/,/, { invert: true })
        .uri({
          scheme: ['http', 'https']
        })
        .allow(null)
    })
  }

  toCSVRecord(): Record<string, string | string[] | boolean> {
    return this.toObject() as Record<string, string | string[] | boolean>
  }

  validate(): Collection<ValidatorError> {
    const { channelsKeyById, feedsKeyByStreamId, countriesKeyByCode, categoriesKeyById } = data

    const errors = new Collection<ValidatorError>()

    const joiResults = this.getSchema().validate(this.toObject(), { abortEarly: false })
    if (joiResults.error) {
      joiResults.error.details.forEach((detail: { message: string }) => {
        errors.add({ line: this.line, message: `${this.id}: ${detail.message}` })
      })
    }

    if (!this.hasValidId()) {
      errors.add({
        line: this.line,
        message: `"${this.id}" must be derived from the channel name "${this.name}" and the country code "${this.country}"`
      })
    }

    if (!this.hasMainFeed()) {
      errors.add({
        line: this.line,
        message: `"${this.id}" does not have a main feed`
      })
    }

    if (this.hasMoreThanOneMainFeed()) {
      errors.add({
        line: this.line,
        message: `"${this.id}" has an more than one main feed`
      })
    }

    if (!this.hasValidReplacedBy(channelsKeyById, feedsKeyByStreamId)) {
      errors.add({
        line: this.line,
        message: `"${this.id}" has an invalid replaced_by "${this.replaced_by}"`
      })
    }

    if (!this.hasValidCountryCode(countriesKeyByCode)) {
      errors.add({
        line: this.line,
        message: `"${this.id}" has an invalid country "${this.country}"`
      })
    }

    if (!this.hasValidCategoryIds(categoriesKeyById)) {
      errors.add({
        line: this.line,
        message: `"${this.id}" has an invalid categories "${this.categories.join(';')}"`
      })
    }

    return errors
  }
}
