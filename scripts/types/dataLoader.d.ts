import { Dictionary, Collection, Storage } from '@freearhey/core'

export type DataLoaderData = {
  feeds: Collection
  feedsGroupedByChannelId: Dictionary
  feedsKeyByStreamId: Dictionary
  feedsKeyById: Dictionary
  channels: Collection
  categories: Collection
  countries: Collection
  languages: Collection
  blocklistRecords: Collection
  timezones: Collection
  regions: Collection
  subdivisions: Collection
  cities: Collection
  citiesKeyByCode: Dictionary
  channelsKeyById: Dictionary
  countriesKeyByCode: Dictionary
  subdivisionsKeyByCode: Dictionary
  categoriesKeyById: Dictionary
  regionsKeyByCode: Dictionary
  timezonesKeyById: Dictionary
  languagesKeyByCode: Dictionary
  logos: Collection
}

export type DataLoaderProps = {
  storage: Storage
}
