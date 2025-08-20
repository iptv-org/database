import { Collection, Storage, Dictionary } from '@freearhey/core'
import { DataLoaderData } from '../../types/dataLoader'
import { ValidatorError } from '../../types/validator'
import { DataLoader } from '../../core/dataLoader'
import { DATA_DIR } from '../../constants'
import chalk from 'chalk'
import {
  BlocklistRecord,
  Subdivision,
  Category,
  Language,
  Timezone,
  Channel,
  Country,
  Region,
  City,
  Feed,
  Logo
} from '../../models'
import {
  BlocklistRecordValidator,
  SubdivisionValidator,
  CategoryValidator,
  LanguageValidator,
  TimezoneValidator,
  ChannelValidator,
  CountryValidator,
  RegionValidator,
  CityValidator,
  FeedValidator,
  LogoValidator
} from '../../validators'

let totalErrors = 0

async function main() {
  const dataStorage = new Storage(DATA_DIR)
  const dataLoader = new DataLoader({ storage: dataStorage })
  const data = await dataLoader.load()

  validateChannels(data)
  validateFeeds(data)
  validateLogo(data)
  validateRegions(data)
  validateBlocklist(data)
  validateCategories(data)
  validateCities(data)
  validateCountries(data)
  validateSubdivisions(data)
  validateLanguages(data)
  validateTimezones(data)

  if (totalErrors > 0) {
    console.log(chalk.red(`\r\n${totalErrors} error(s)`))
    process.exit(1)
  }
}

main()

function validateChannels(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.channels, ['id']).forEach((channel: Channel) => {
    errors.add({
      line: channel.getLine(),
      message: `channel with id "${channel.id}" already exists`
    })
  })

  const validator = new ChannelValidator({ data })
  data.channels.forEach((channel: Channel) => {
    errors = errors.concat(validator.validate(channel))
  })

  if (errors.count()) displayErrors('channels.csv', errors)

  totalErrors += errors.count()
}

function validateFeeds(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.feeds, ['channelId', 'id']).forEach((feed: Feed) => {
    errors.add({
      line: feed.getLine(),
      message: `feed with channel "${feed.channelId}" and id "${feed.id}" already exists`
    })
  })

  const validator = new FeedValidator({ data })
  data.feeds.forEach((feed: Feed) => {
    errors = errors.concat(validator.validate(feed))
  })

  if (errors.count()) displayErrors('feeds.csv', errors)

  totalErrors += errors.count()
}

function validateLogo(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.logos, ['channelId', 'feedId', 'url']).forEach((logo: Logo) => {
    errors.add({
      line: logo.getLine(),
      message: `logo with channelId "${logo.channelId}", feedId "${logo.feedId ?? ''}" and url "${
        logo.url
      }" already exists`
    })
  })

  const validator = new LogoValidator({ data })
  data.logos.forEach((logo: Logo) => {
    errors = errors.concat(validator.validate(logo))
  })

  if (errors.count()) displayErrors('logos.csv', errors)

  totalErrors += errors.count()
}

function validateRegions(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.regions, ['code']).forEach((region: Region) => {
    errors.add({
      line: region.getLine(),
      message: `region with code "${region.code}" already exists`
    })
  })

  const validator = new RegionValidator({ data })
  data.regions.forEach((region: Region) => {
    errors = errors.concat(validator.validate(region))
  })

  if (errors.count()) displayErrors('regions.csv', errors)

  totalErrors += errors.count()
}

function validateBlocklist(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.blocklistRecords, ['channelId', 'ref']).forEach(
    (blocklistRecord: BlocklistRecord) => {
      errors.add({
        line: blocklistRecord.getLine(),
        message: `blocklist record with channel "${blocklistRecord.channelId}" and ref "${blocklistRecord.ref}" already exists`
      })
    }
  )

  const validator = new BlocklistRecordValidator({ data })
  data.blocklistRecords.forEach((blocklistRecord: BlocklistRecord) => {
    errors = errors.concat(validator.validate(blocklistRecord))
  })

  if (errors.count()) displayErrors('blocklist.csv', errors)

  totalErrors += errors.count()
}

function validateCategories(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.categories, ['id']).forEach((category: Category) => {
    errors.add({
      line: category.getLine(),
      message: `category with id "${category.id}" already exists`
    })
  })

  const validator = new CategoryValidator({ data })
  data.categories.forEach((category: Category) => {
    errors = errors.concat(validator.validate(category))
  })

  if (errors.count()) displayErrors('categories.csv', errors)

  totalErrors += errors.count()
}

function validateCountries(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.countries, ['code']).forEach((country: Country) => {
    errors.add({
      line: country.getLine(),
      message: `country with code "${country.code}" already exists`
    })
  })

  const validator = new CountryValidator({ data })
  data.countries.forEach((country: Country) => {
    errors = errors.concat(validator.validate(country))
  })

  if (errors.count()) displayErrors('countries.csv', errors)

  totalErrors += errors.count()
}

function validateSubdivisions(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.subdivisions, ['code']).forEach((subdivision: Subdivision) => {
    errors.add({
      line: subdivision.getLine(),
      message: `subdivision with code "${subdivision.code}" already exists`
    })
  })

  const validator = new SubdivisionValidator({ data })
  data.subdivisions.forEach((subdivision: Subdivision) => {
    errors = errors.concat(validator.validate(subdivision))
  })

  if (errors.count()) displayErrors('subdivisions.csv', errors)

  totalErrors += errors.count()
}

function validateCities(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.cities, ['code']).forEach((city: City) => {
    errors.add({
      line: city.getLine(),
      message: `city with code "${city.code}" already exists`
    })
  })

  findDuplicatesBy(data.cities, ['wikidataId']).forEach((city: City) => {
    errors.add({
      line: city.getLine(),
      message: `city with wikidata_id "${city.wikidataId}" already exists`
    })
  })

  const validator = new CityValidator({ data })
  data.cities.forEach((city: City) => {
    errors = errors.concat(validator.validate(city))
  })

  if (errors.count()) displayErrors('cities.csv', errors)

  totalErrors += errors.count()
}

function validateLanguages(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.languages, ['code']).forEach((language: Language) => {
    errors.add({
      line: language.getLine(),
      message: `language with code "${language.code}" already exists`
    })
  })

  const validator = new LanguageValidator({ data })
  data.languages.forEach((language: Language) => {
    errors = errors.concat(validator.validate(language))
  })

  if (errors.count()) displayErrors('languages.csv', errors)

  totalErrors += errors.count()
}

function validateTimezones(data: DataLoaderData) {
  let errors = new Collection()

  findDuplicatesBy(data.timezones, ['id']).forEach((timezone: Timezone) => {
    errors.add({
      line: timezone.getLine(),
      message: `timezone with id "${timezone.id}" already exists`
    })
  })

  const validator = new TimezoneValidator({ data })
  data.timezones.forEach((timezone: Timezone) => {
    errors = errors.concat(validator.validate(timezone))
  })

  if (errors.count()) displayErrors('timezones.csv', errors)

  totalErrors += errors.count()
}

function findDuplicatesBy(items: Collection, keys: string[]) {
  const duplicates = new Collection()
  const buffer = new Dictionary()

  items.forEach((item: { [key: string]: string | number }) => {
    const normId = keys.map(key => (item[key] ?? '').toString().toLowerCase()).join()
    if (buffer.has(normId)) {
      duplicates.add(item)
    }

    buffer.set(normId, true)
  })

  return duplicates
}

function displayErrors(filepath: string, errors: Collection) {
  console.log(`\r\n${chalk.underline(filepath)}`)

  errors.forEach((error: ValidatorError) => {
    const position = error.line.toString().padEnd(6, ' ')
    console.log(` ${chalk.gray(position) + error.message}`)
  })
}
