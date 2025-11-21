import { Dictionary, Collection } from '@freearhey/core'
import {
  BlocklistRecord,
  Category,
  Channel,
  City,
  Country,
  Feed,
  Language,
  Logo,
  Region,
  Subdivision,
  Timezone
} from '../models'

export type DatabaseData = {
  feeds: Collection<Feed>
  feedsGroupedByChannelId: Dictionary<Feed[]>
  feedsKeyByStreamId: Dictionary<Feed>
  channels: Collection<Channel>
  categories: Collection<Category>
  countries: Collection<Country>
  languages: Collection<Language>
  blocklistRecords: Collection<BlocklistRecord>
  timezones: Collection<Timezone>
  regions: Collection<Region>
  subdivisions: Collection<Subdivision>
  cities: Collection<City>
  citiesKeyByCode: Dictionary<City>
  channelsKeyById: Dictionary<Channel>
  countriesKeyByCode: Dictionary<Country>
  subdivisionsKeyByCode: Dictionary<Subdivision>
  categoriesKeyById: Dictionary<Category>
  regionsKeyByCode: Dictionary<Region>
  timezonesKeyById: Dictionary<Timezone>
  languagesKeyByCode: Dictionary<Language>
  logos: Collection<Logo>
}
