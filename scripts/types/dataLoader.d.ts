import { Dictionary, Collection, Storage } from '@freearhey/core'

export type DataLoaderData = {
  feeds: Collection
  feedsGroupedByChannelId: Dictionary
  feedsKeyByStreamId: Dictionary
  channels: Collection
  categories: Collection
  countries: Collection
  languages: Collection
  blocklistRecords: Collection
  timezones: Collection
  regions: Collection
  subdivisions: Collection
  channelsKeyById: Dictionary
  countriesKeyByCode: Dictionary
  subdivisionsKeyByCode: Dictionary
  categoriesKeyById: Dictionary
  regionsKeyByCode: Dictionary
  timezonesKeyById: Dictionary
  languagesKeyByCode: Dictionary
}

export type DataLoaderProps = {
  storage: Storage
}
