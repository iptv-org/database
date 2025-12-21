import { parseCSV, displayErrors, convertToCSV } from '../core/utils'
import { Dictionary, Collection } from '@freearhey/core'
import { Storage, File } from '@freearhey/storage-js'
import { ValidatorError } from '../types/validator'
import { DatabaseData } from '../types/db'
import { DATA_DIR } from '../constants'
import { CSVRow } from '../types/utils'
import chalk from 'chalk'
import {
  Feed,
  Channel,
  BlocklistRecord,
  Language,
  Country,
  Subdivision,
  Region,
  Timezone,
  Category,
  City,
  Logo
} from '../models'

let data: DatabaseData = {
  channels: new Collection<Channel>(),
  feeds: new Collection<Feed>(),
  categories: new Collection<Category>(),
  languages: new Collection<Language>(),
  blocklistRecords: new Collection<BlocklistRecord>(),
  timezones: new Collection<Timezone>(),
  regions: new Collection<Region>(),
  subdivisions: new Collection<Subdivision>(),
  cities: new Collection<City>(),
  countries: new Collection<Country>(),
  logos: new Collection<Logo>(),

  citiesKeyByCode: new Dictionary<City>(),
  feedsGroupedByChannelId: new Dictionary<Feed[]>(),
  feedsKeyByStreamId: new Dictionary<Feed>(),
  channelsKeyById: new Dictionary<Channel>(),
  countriesKeyByCode: new Dictionary<Country>(),
  subdivisionsKeyByCode: new Dictionary<Subdivision>(),
  categoriesKeyById: new Dictionary<Category>(),
  regionsKeyByCode: new Dictionary<Region>(),
  timezonesKeyById: new Dictionary<Timezone>(),
  languagesKeyByCode: new Dictionary<Language>()
}

let cache: DatabaseData = {
  channels: new Collection<Channel>(),
  feeds: new Collection<Feed>(),
  categories: new Collection<Category>(),
  languages: new Collection<Language>(),
  blocklistRecords: new Collection<BlocklistRecord>(),
  timezones: new Collection<Timezone>(),
  regions: new Collection<Region>(),
  subdivisions: new Collection<Subdivision>(),
  cities: new Collection<City>(),
  countries: new Collection<Country>(),
  logos: new Collection<Logo>(),

  citiesKeyByCode: new Dictionary<City>(),
  feedsGroupedByChannelId: new Dictionary<Feed[]>(),
  feedsKeyByStreamId: new Dictionary<Feed>(),
  channelsKeyById: new Dictionary<Channel>(),
  countriesKeyByCode: new Dictionary<Country>(),
  subdivisionsKeyByCode: new Dictionary<Subdivision>(),
  categoriesKeyById: new Dictionary<Category>(),
  regionsKeyByCode: new Dictionary<Region>(),
  timezonesKeyById: new Dictionary<Timezone>(),
  languagesKeyByCode: new Dictionary<Language>()
}

const dataStorage = new Storage(DATA_DIR)

async function loadData(): Promise<DatabaseData> {
  const files = await dataStorage.list('*.csv')

  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'csv') continue

    const csv = await dataStorage.load(file.basename())
    const rows = csv.split(/\r\n/)
    const headers = rows[0].split(',')
    const errors = new Collection<ValidatorError>()
    for (const [i, line] of rows.entries()) {
      if (!line.trim()) continue
      if (line.indexOf('\n') > -1) {
        errors.add({
          line: i + 1,
          message: 'row has the wrong line ending character, should be CRLF'
        })
      }
      if (line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).length !== headers.length) {
        errors.add({
          line: i + 1,
          message: 'row has the wrong number of columns'
        })
      }
    }

    if (errors.isNotEmpty()) {
      displayErrors(filepath, errors)
      console.log(chalk.red(`\r\n${errors.count()} error(s)`))
      process.exit(1)
    }

    const parsed = await parseCSV(csv)
    const filename = file.name()

    switch (filename) {
      case 'channels': {
        data.channels = parsed.map((row: CSVRow) => Channel.fromRow(row))
        break
      }
      case 'feeds': {
        data.feeds = parsed.map((row: CSVRow) => Feed.fromRow(row))
        break
      }
      case 'logos': {
        data.logos = parsed.map((row: CSVRow) => Logo.fromRow(row))
        break
      }
      case 'blocklist': {
        data.blocklistRecords = parsed.map((row: CSVRow) => BlocklistRecord.fromRow(row))
        break
      }
      case 'categories': {
        data.categories = parsed.map((row: CSVRow) => Category.fromRow(row))
        break
      }
      case 'timezones': {
        data.timezones = parsed.map((row: CSVRow) => Timezone.fromRow(row))
        break
      }
      case 'regions': {
        data.regions = parsed.map((row: CSVRow) => Region.fromRow(row))
        break
      }
      case 'languages': {
        data.languages = parsed.map((row: CSVRow) => Language.fromRow(row))
        break
      }
      case 'countries': {
        data.countries = parsed.map((row: CSVRow) => Country.fromRow(row))
        break
      }
      case 'subdivisions': {
        data.subdivisions = parsed.map((row: CSVRow) => Subdivision.fromRow(row))
        break
      }
      case 'cities': {
        data.cities = parsed.map((row: CSVRow) => City.fromRow(row))
        break
      }
    }
  }

  data.channelsKeyById = data.channels.keyBy((channel: Channel) => channel.id)
  data.feedsGroupedByChannelId = data.feeds.groupBy((feed: Feed) => feed.channel)
  data.feedsKeyByStreamId = data.feeds.keyBy((feed: Feed) => feed.getStreamId())
  data.categoriesKeyById = data.categories.keyBy((category: Category) => category.id)
  data.timezonesKeyById = data.timezones.keyBy((timezone: Timezone) => timezone.id)
  data.regionsKeyByCode = data.regions.keyBy((region: Region) => region.code)
  data.languagesKeyByCode = data.languages.keyBy((language: Language) => language.code)
  data.countriesKeyByCode = data.countries.keyBy((country: Country) => country.code)
  data.subdivisionsKeyByCode = data.subdivisions.keyBy(
    (subdivision: Subdivision) => subdivision.code
  )
  data.citiesKeyByCode = data.cities.keyBy((city: City) => city.code)

  return data
}

function cacheData() {
  cache = {
    channels: data.channels.clone(),
    feeds: data.feeds.clone(),
    categories: data.categories.clone(),
    languages: data.languages.clone(),
    blocklistRecords: data.blocklistRecords.clone(),
    timezones: data.timezones.clone(),
    regions: data.regions.clone(),
    subdivisions: data.subdivisions.clone(),
    cities: data.cities.clone(),
    countries: data.countries.clone(),
    logos: data.logos.clone(),
    citiesKeyByCode: data.citiesKeyByCode,
    feedsGroupedByChannelId: data.feedsGroupedByChannelId,
    feedsKeyByStreamId: data.feedsKeyByStreamId,
    channelsKeyById: data.channelsKeyById,
    countriesKeyByCode: data.countriesKeyByCode,
    subdivisionsKeyByCode: data.subdivisionsKeyByCode,
    categoriesKeyById: data.categoriesKeyById,
    regionsKeyByCode: data.regionsKeyByCode,
    timezonesKeyById: data.timezonesKeyById,
    languagesKeyByCode: data.languagesKeyByCode
  }
}

function resetData() {
  data = {
    channels: cache.channels,
    feeds: cache.feeds,
    categories: cache.categories,
    languages: cache.languages,
    blocklistRecords: cache.blocklistRecords,
    timezones: cache.timezones,
    regions: cache.regions,
    subdivisions: cache.subdivisions,
    cities: cache.cities,
    countries: cache.countries,
    logos: cache.logos,
    citiesKeyByCode: cache.citiesKeyByCode,
    feedsGroupedByChannelId: cache.feedsGroupedByChannelId,
    feedsKeyByStreamId: cache.feedsKeyByStreamId,
    channelsKeyById: cache.channelsKeyById,
    countriesKeyByCode: cache.countriesKeyByCode,
    subdivisionsKeyByCode: cache.subdivisionsKeyByCode,
    categoriesKeyById: cache.categoriesKeyById,
    regionsKeyByCode: cache.regionsKeyByCode,
    timezonesKeyById: cache.timezonesKeyById,
    languagesKeyByCode: cache.languagesKeyByCode
  }
}

async function saveData() {
  const channels = data.channels
    .sortBy((channel: Channel) => channel.id.toLowerCase(), 'asc', false)
    .map((channel: Channel) => channel.toCSVRecord())
    .all()
  await dataStorage.save('channels.csv', convertToCSV(channels))

  const feeds = data.feeds
    .sortBy((feed: Feed) => `${feed.getStreamId()}`.toLowerCase(), 'asc', false)
    .map((feed: Feed) => feed.toCSVRecord())
    .all()
  await dataStorage.save('feeds.csv', convertToCSV(feeds))

  const blocklistRecords = data.blocklistRecords
    .sortBy(
      (blocklistRecord: BlocklistRecord) => blocklistRecord.channel.toLowerCase(),
      'asc',
      false
    )
    .map((blocklistRecord: BlocklistRecord) => blocklistRecord.toCSVRecord())
    .all()
  await dataStorage.save('blocklist.csv', convertToCSV(blocklistRecords))

  const logos = data.logos
    .sortBy((logo: Logo) => `${logo.channel}${logo.feed}${logo.url}`.toLowerCase(), 'asc', false)
    .map((logo: Logo) => logo.toCSVRecord())
    .all()
  await dataStorage.save('logos.csv', convertToCSV(logos))

  const cities = data.cities
    .sortBy(
      (city: City) => `${city.country}_${city.subdivision || ''}_${city.code}`.toLowerCase(),
      'asc',
      true
    )
    .map((city: City) => city.toCSVRecord())
    .all()
  await dataStorage.save('cities.csv', convertToCSV(cities))
}

export { loadData, data, saveData, cacheData, resetData }
