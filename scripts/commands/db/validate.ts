import { displayErrors, findDuplicatesBy } from '../../core/utils'
import { ValidatorError } from '../../types/validator'
import { loadData, data } from '../../core/db'
import { Collection } from '@freearhey/core'
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

let totalErrors = 0

async function main() {
  await loadData()

  validateChannels()
  validateFeeds()
  validateLogo()
  validateRegions()
  validateBlocklist()
  validateCategories()
  validateCities()
  validateCountries()
  validateSubdivisions()
  validateLanguages()
  validateTimezones()

  if (totalErrors > 0) {
    console.log(chalk.red(`\r\n${totalErrors} error(s)`))
    process.exit(1)
  }
}

main()

function validateChannels() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Channel>(data.channels, (channel: Channel) => channel.id).forEach(
    (channel: Channel) => {
      errors.add({
        line: channel.line,
        message: `channel with id "${channel.id}" already exists`
      })
    }
  )

  data.channels.forEach((channel: Channel) => {
    errors = errors.concat(channel.validate())
  })

  if (errors.count()) displayErrors('channels.csv', errors)

  totalErrors += errors.count()
}

function validateFeeds() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Feed>(data.feeds, (feed: Feed) =>
    `$${feed.channel}${feed.id}`.toLowerCase()
  ).forEach((feed: Feed) => {
    errors.add({
      line: feed.line,
      message: `feed with channel "${feed.channel}" and id "${feed.id}" already exists`
    })
  })

  data.feeds.forEach((feed: Feed) => {
    errors = errors.concat(feed.validate())
  })

  if (errors.count()) displayErrors('feeds.csv', errors)

  totalErrors += errors.count()
}

function validateLogo() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Logo>(data.logos, (logo: Logo) =>
    `${logo.channel}${logo.feed}${logo.url}`.toLowerCase()
  ).forEach((logo: Logo) => {
    errors.add({
      line: logo.line,
      message: `logo with channel "${logo.channel}", feed "${logo.feed ?? ''}" and url "${
        logo.url
      }" already exists`
    })
  })

  data.logos.forEach((logo: Logo) => {
    errors = errors.concat(logo.validate())
  })

  if (errors.count()) displayErrors('logos.csv', errors)

  totalErrors += errors.count()
}

function validateRegions() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Region>(data.regions, (region: Region) => region.code.toLowerCase()).forEach(
    (region: Region) => {
      errors.add({
        line: region.line,
        message: `region with code "${region.code}" already exists`
      })
    }
  )

  data.regions.forEach((region: Region) => {
    errors = errors.concat(region.validate())
  })

  if (errors.count()) displayErrors('regions.csv', errors)

  totalErrors += errors.count()
}

function validateBlocklist() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<BlocklistRecord>(data.blocklistRecords, (record: BlocklistRecord) =>
    `${record.channel}${record.ref}`.toLowerCase()
  ).forEach((record: BlocklistRecord) => {
    errors.add({
      line: record.line,
      message: `blocklist record with channel "${record.channel}" and ref "${record.ref}" already exists`
    })
  })

  data.blocklistRecords.forEach((record: BlocklistRecord) => {
    errors = errors.concat(record.validate())
  })

  if (errors.count()) displayErrors('blocklist.csv', errors)

  totalErrors += errors.count()
}

function validateCategories() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Category>(data.categories, (category: Category) =>
    category.id.toLowerCase()
  ).forEach((category: Category) => {
    errors.add({
      line: category.line,
      message: `category with id "${category.id}" already exists`
    })
  })

  data.categories.forEach((category: Category) => {
    errors = errors.concat(category.validate())
  })

  if (errors.count()) displayErrors('categories.csv', errors)

  totalErrors += errors.count()
}

function validateCountries() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Country>(data.countries, (country: Country) =>
    country.code.toLowerCase()
  ).forEach((country: Country) => {
    errors.add({
      line: country.line,
      message: `country with code "${country.code}" already exists`
    })
  })

  data.countries.forEach((country: Country) => {
    errors = errors.concat(country.validate())
  })

  if (errors.count()) displayErrors('countries.csv', errors)

  totalErrors += errors.count()
}

function validateSubdivisions() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Subdivision>(data.subdivisions, (subdivision: Subdivision) =>
    subdivision.code.toLowerCase()
  ).forEach((subdivision: Subdivision) => {
    errors.add({
      line: subdivision.line,
      message: `subdivision with code "${subdivision.code}" already exists`
    })
  })

  data.subdivisions.forEach((subdivision: Subdivision) => {
    errors = errors.concat(subdivision.validate())
  })

  if (errors.count()) displayErrors('subdivisions.csv', errors)

  totalErrors += errors.count()
}

function validateCities() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<City>(data.cities, (city: City) => city.code.toLowerCase()).forEach(
    (city: City) => {
      errors.add({
        line: city.line,
        message: `city with code "${city.code}" already exists`
      })
    }
  )

  findDuplicatesBy(data.cities, (city: City) => city.wikidata_id.toLowerCase()).forEach(
    (city: City) => {
      errors.add({
        line: city.line,
        message: `city with wikidata_id "${city.wikidata_id}" already exists`
      })
    }
  )

  data.cities.forEach((city: City) => {
    errors = errors.concat(city.validate())
  })

  if (errors.count()) displayErrors('cities.csv', errors)

  totalErrors += errors.count()
}

function validateLanguages() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Language>(data.languages, (language: Language) =>
    language.code.toLowerCase()
  ).forEach((language: Language) => {
    errors.add({
      line: language.line,
      message: `language with code "${language.code}" already exists`
    })
  })

  data.languages.forEach((language: Language) => {
    errors = errors.concat(language.validate())
  })

  if (errors.count()) displayErrors('languages.csv', errors)

  totalErrors += errors.count()
}

function validateTimezones() {
  let errors = new Collection<ValidatorError>()

  findDuplicatesBy<Timezone>(data.timezones, (timezone: Timezone) =>
    timezone.id.toLowerCase()
  ).forEach((timezone: Timezone) => {
    errors.add({
      line: timezone.line,
      message: `timezone with id "${timezone.id}" already exists`
    })
  })

  data.timezones.forEach((timezone: Timezone) => {
    errors = errors.concat(timezone.validate())
  })

  if (errors.count()) displayErrors('timezones.csv', errors)

  totalErrors += errors.count()
}
