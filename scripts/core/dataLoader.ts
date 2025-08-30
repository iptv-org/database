import { Storage, File, Dictionary, Collection } from '@freearhey/core'
import { DataLoaderData, DataLoaderProps } from '../types/dataLoader'
import { CSVParserRow } from '../types/csvParser'
import { CSVParser } from './'
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
  Logo
} from '../models'
import { City } from '../models/city'

export class DataLoader {
  storage: Storage
  parser: CSVParser

  constructor({ storage }: DataLoaderProps) {
    this.storage = storage
    this.parser = new CSVParser()
  }

  async load(): Promise<DataLoaderData> {
    const files = await this.storage.list('*.csv')

    const data: DataLoaderData = {
      channels: new Collection(),
      feeds: new Collection(),
      categories: new Collection(),
      languages: new Collection(),
      blocklistRecords: new Collection(),
      timezones: new Collection(),
      regions: new Collection(),
      subdivisions: new Collection(),
      cities: new Collection(),
      citiesKeyByCode: new Dictionary(),
      countries: new Collection(),
      feedsGroupedByChannelId: new Dictionary(),
      feedsKeyByStreamId: new Dictionary(),
      feedsKeyById: new Dictionary(),
      channelsKeyById: new Dictionary(),
      countriesKeyByCode: new Dictionary(),
      subdivisionsKeyByCode: new Dictionary(),
      categoriesKeyById: new Dictionary(),
      regionsKeyByCode: new Dictionary(),
      timezonesKeyById: new Dictionary(),
      languagesKeyByCode: new Dictionary(),
      logos: new Collection()
    }

    for (const filepath of files) {
      const file = new File(filepath)
      if (file.extension() !== 'csv') continue

      const csv = await this.storage.load(file.basename())
      const rows = csv.split(/\r\n/)
      const headers = rows[0].split(',')
      const errors = new Collection()
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

      if (errors.notEmpty()) {
        displayErrors(filepath, errors)
        console.log(chalk.red(`\r\n${errors.count()} error(s)`))
        process.exit(1)
      }

      const parsed = await this.parser.parse(csv)
      const filename = file.name()

      switch (filename) {
        case 'channels': {
          const channels = parsed.map((row: CSVParserRow) =>
            new Channel(row.data).setLine(row.line)
          )
          data.channels = channels
          data.channelsKeyById = channels.keyBy((channel: Channel) => channel.id)
          break
        }
        case 'feeds': {
          const feeds = parsed.map((row: CSVParserRow) => new Feed(row.data).setLine(row.line))
          data.feeds = feeds
          data.feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)
          data.feedsKeyByStreamId = feeds.keyBy((feed: Feed) => feed.getStreamId())
          data.feedsKeyById = feeds.keyBy((feed: Feed) => feed.id)
          break
        }
        case 'logos': {
          const logos = parsed.map((row: CSVParserRow) => new Logo(row.data).setLine(row.line))
          data.logos = logos
          break
        }
        case 'blocklist': {
          const blocklistRecords = parsed.map((row: CSVParserRow) =>
            new BlocklistRecord(row.data).setLine(row.line)
          )
          data.blocklistRecords = blocklistRecords
          break
        }
        case 'categories': {
          const categories = parsed.map((row: CSVParserRow) =>
            new Category(row.data).setLine(row.line)
          )
          data.categories = categories
          data.categoriesKeyById = categories.keyBy((category: Category) => category.id)
          break
        }
        case 'timezones': {
          const timezones = parsed.map((row: CSVParserRow) =>
            new Timezone(row.data).setLine(row.line)
          )
          data.timezones = timezones
          data.timezonesKeyById = timezones.keyBy((timezone: Timezone) => timezone.id)
          break
        }
        case 'regions': {
          const regions = parsed.map((row: CSVParserRow) => new Region(row.data).setLine(row.line))
          data.regions = regions
          data.regionsKeyByCode = regions.keyBy((region: Region) => region.code)
          break
        }
        case 'languages': {
          const languages = parsed.map((row: CSVParserRow) =>
            new Language(row.data).setLine(row.line)
          )
          data.languages = languages
          data.languagesKeyByCode = languages.keyBy((language: Language) => language.code)
          break
        }
        case 'countries': {
          const countries = parsed.map((row: CSVParserRow) =>
            new Country(row.data).setLine(row.line)
          )
          data.countries = countries
          data.countriesKeyByCode = countries.keyBy((country: Country) => country.code)
          break
        }
        case 'subdivisions': {
          const subdivisions = parsed.map((row: CSVParserRow) =>
            new Subdivision(row.data).setLine(row.line)
          )
          data.subdivisions = subdivisions
          data.subdivisionsKeyByCode = subdivisions.keyBy(
            (subdivision: Subdivision) => subdivision.code
          )
          break
        }
        case 'cities': {
          const cities = parsed.map((row: CSVParserRow) => new City(row.data).setLine(row.line))
          data.cities = cities
          data.citiesKeyByCode = cities.keyBy((subdivision: Subdivision) => subdivision.code)
          break
        }
      }
    }

    data.channels = data.channels.map((channel: Channel) =>
      channel.withFeeds(data.feedsGroupedByChannelId)
    )

    data.cities = data.cities.map((city: City) => city.withSubdivision(data.subdivisionsKeyByCode))
    data.citiesKeyByCode = data.cities.keyBy((subdivision: Subdivision) => subdivision.code)

    return data
  }
}

function displayErrors(filepath: string, errors: Collection) {
  console.log(`\r\n${chalk.underline(filepath)}`)

  errors.forEach((error: ValidatorError) => {
    const position = error.line.toString().padEnd(6, ' ')
    console.log(` ${chalk.gray(position) + error.message}`)
  })
}
