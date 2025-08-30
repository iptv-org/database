import { Dictionary, Collection } from '@freearhey/core'
import { ChannelData } from '../types/channel'
import { createChannelId } from '../utils'
import { IssueData } from '../core'
import JoiDate from '@joi/date'
import { Model } from './model'
import { Feed } from './feed'
import BaseJoi from 'joi'

const Joi = BaseJoi.extend(JoiDate)

export class Channel extends Model {
  id: string
  name: string
  altNames?: Collection
  networkName?: string
  ownerNames?: Collection
  countryCode: string
  categoryIds?: Collection
  isNSFW: boolean
  launchedDateString?: string
  closedDateString?: string
  replacedBy?: string
  websiteUrl?: string
  feeds?: Collection

  constructor(data: ChannelData) {
    super()

    this.id = data.id
    this.name = data.name
    this.altNames = data.alt_names ? new Collection(data.alt_names) : undefined
    this.networkName = data.network
    this.ownerNames = data.owners ? new Collection(data.owners) : undefined
    this.countryCode = data.country
    this.categoryIds = data.categories ? new Collection(data.categories) : undefined
    this.isNSFW = data.is_nsfw
    this.launchedDateString = data.launched
    this.closedDateString = data.closed
    this.replacedBy = data.replaced_by
    this.websiteUrl = data.website
  }

  setId(id: string): this {
    this.id = id

    return this
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
    if (data.alt_names !== undefined) this.altNames = new Collection(data.alt_names)
    if (data.network !== undefined) this.networkName = data.network
    if (data.owners !== undefined) this.ownerNames = new Collection(data.owners)
    if (data.country !== undefined) this.countryCode = data.country
    if (data.categories !== undefined) this.categoryIds = new Collection(data.categories)
    if (data.is_nsfw !== undefined) this.isNSFW = data.is_nsfw
    if (data.launched !== undefined) this.launchedDateString = data.launched
    if (data.closed !== undefined) this.closedDateString = data.closed
    if (data.replaced_by !== undefined) this.replacedBy = data.replaced_by
    if (data.website !== undefined) this.websiteUrl = data.website

    return this
  }

  withFeeds(feedsGroupedByChannelId: Dictionary): this {
    this.feeds = new Collection(feedsGroupedByChannelId.get(this.id))

    return this
  }

  getFeeds(): Collection {
    if (!this.feeds) return new Collection()

    return this.feeds
  }

  hasValidId(): boolean {
    const expectedId = createChannelId(this.name, this.countryCode)

    return expectedId === this.id
  }

  hasMainFeed(): boolean {
    const feeds = this.getFeeds()

    if (feeds.isEmpty()) return false

    const mainFeed = feeds.find((feed: Feed) => feed.isMain)

    return !!mainFeed
  }

  hasMoreThanOneMainFeed(): boolean {
    const mainFeeds = this.getFeeds().filter((feed: Feed) => feed.isMain)

    return mainFeeds.count() > 1
  }

  hasValidReplacedBy(channelsKeyById: Dictionary, feedsKeyByStreamId: Dictionary): boolean {
    if (!this.replacedBy) return true

    const [channelId, feedId] = this.replacedBy.split('@')

    if (channelsKeyById.missing(channelId)) return false
    if (feedId && feedsKeyByStreamId.missing(this.replacedBy)) return false

    return true
  }

  hasValidCountryCode(countriesKeyByCode: Dictionary): boolean {
    return countriesKeyByCode.has(this.countryCode)
  }

  hasValidCategoryIds(categoriesKeyById: Dictionary): boolean {
    const hasInvalid = this.getCategoryIds().find((id: string) => categoriesKeyById.missing(id))

    return !hasInvalid
  }

  getCategoryIds(): Collection {
    if (!this.categoryIds) return new Collection()

    return this.categoryIds
  }

  getAltNames(): Collection {
    if (!this.altNames) return new Collection()

    return this.altNames
  }

  getOwnerNames(): Collection {
    if (!this.ownerNames) return new Collection()

    return this.ownerNames
  }

  data(): ChannelData {
    return {
      id: this.id,
      name: this.name,
      alt_names: this.getAltNames().all(),
      network: this.networkName,
      owners: this.getOwnerNames().all(),
      country: this.countryCode,
      categories: this.getCategoryIds().all(),
      is_nsfw: this.isNSFW,
      launched: this.launchedDateString,
      closed: this.closedDateString,
      replaced_by: this.replacedBy,
      website: this.websiteUrl
    }
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
}
