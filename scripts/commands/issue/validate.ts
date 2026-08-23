import { Category, City, Country, Language, Subdivision, Timezone } from '../../models'
import { createChannelId, createFeedId, createStreamId, parseIssueBody } from '../../core/utils'
import { Storage } from '@freearhey/storage-js'
import { data, loadData } from '../../core/db'
import { DataSet } from '../../core/dataSet'
import { LOGS_DIR } from '../../constants'
import { Location } from '../../types/db'
import { Logger } from '@freearhey/core'
import { program } from 'commander'
import dayjs from 'dayjs'

program
  .requiredOption('--body <body>', 'The full markdown body text of the issue')
  .option('--labels <labels>', 'Comma-separated string of label names', '')
  .parse(process.argv)

const { body, labels } = program.opts()

const logsStorage = new Storage(LOGS_DIR)
let errors: string[] = []

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('validation...')
  const dataSet = parseIssueBody(body)
  if (labels.includes('channels:add')) validateAddChannelRequest(dataSet)
  if (labels.includes('channels:edit')) validateEditChannelRequest(dataSet)
  if (labels.includes('channels:remove')) validateRemoveChannelRequest(dataSet)
  if (labels.includes('feeds:add')) validateAddFeedRequest(dataSet)
  if (labels.includes('feeds:edit')) validateEditFeedRequest(dataSet)
  if (labels.includes('feeds:remove')) validateRemoveFeedRequest(dataSet)
  if (labels.includes('logos:add')) validateAddLogoRequest(dataSet)
  if (labels.includes('logos:edit')) validateEditLogoRequest(dataSet)
  if (labels.includes('logos:remove')) validateRemoveLogoRequest(dataSet)
  if (labels.includes('cities:add')) validateAddCityRequest(dataSet)
  if (labels.includes('cities:edit')) validateEditCityRequest(dataSet)
  if (labels.includes('cities:remove')) validateRemoveCityRequest(dataSet)
  if (labels.includes('blocklist:add')) validateAddBlocklistRecordRequest(dataSet)
  if (labels.includes('blocklist:remove')) validateRemoveBlocklistRecordRequest(dataSet)

  done()
}

function validateRemoveBlocklistRecordRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  } else {
    const records = data.blocklistRecordsGroupedByChannelId.get(channelId) || []
    if (!records.length) {
      errors.push(`There is no records with the channel ID "${channelId}" in the database`)
      done()
    }
  }

  validateBlocklistRecordData(dataSet)
}

function validateAddBlocklistRecordRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }
  }

  const ref = dataSet.getString('ref')?.trim()
  if (!ref) {
    errors.push('The request is missing the "Reference"')
    done()
  }

  validateBlocklistRecordData(dataSet)
}

function validateBlocklistRecordData(dataSet: DataSet) {
  if (dataSet.has('ref')) {
    errors = errors.concat(dataSet.validate('ref', ['validUrl']))
  }
}

function validateRemoveCityRequest(dataSet: DataSet) {
  const cityCode = dataSet.getString('city_code')?.trim()
  if (!cityCode) {
    errors.push('The request is missing the "City Code"')
    done()
  } else {
    const city: City | undefined = data.citiesKeyByCode.get(cityCode)
    if (!city) {
      errors.push(`There is no city with the code "${cityCode}" in the database`)
      done()
    }
  }

  validateCityData(dataSet)
}

function validateEditCityRequest(dataSet: DataSet) {
  const cityCode = dataSet.getString('city_code')?.trim()
  if (!cityCode) {
    errors.push('The request is missing the "City Code"')
    done()
  } else {
    const city: City | undefined = data.citiesKeyByCode.get(cityCode)
    if (!city) {
      errors.push(`There is no city with the code "${cityCode}" in the database`)
      done()
    }
  }

  if (dataSet.missing(['city_name', 'country', 'subdivision', 'wikidata_id'])) {
    errors.push('The request does not contain any changes')
    done()
  }

  validateCityData(dataSet)
}

function validateAddCityRequest(dataSet: DataSet) {
  const countryCode = dataSet.getString('country')?.trim()
  if (!countryCode) {
    errors.push('The request is missing the "Country"')
    done()
  }

  const cityName = dataSet.getString('city_name')?.trim()
  if (!cityName) {
    errors.push('The request is missing the "City Name"')
    done()
  }

  const cityCode = dataSet.getString('city_code')?.trim()
  if (!cityCode) {
    errors.push('The request is missing the "City Code"')
    done()
  }

  const wikidataId = dataSet.getString('wikidata_id')?.trim()
  if (!wikidataId) {
    errors.push('The request is missing the "Wikidata ID"')
    done()
  }

  validateCityData(dataSet)
}

function validateCityData(dataSet: DataSet) {
  if (dataSet.has('city_code')) {
    errors = errors.concat(dataSet.validate('city_code', ['validLocode']))
  }

  const countryCode = dataSet.getString('country')?.trim()
  if (countryCode) {
    const country: Country | undefined = data.countriesKeyByCode.get(countryCode)
    if (!country) {
      errors.push(`There is no country with the code "${countryCode}" in the database`)
    }
  }

  const subdivisionCode = dataSet.getString('subdivision')?.trim()
  if (subdivisionCode) {
    const subdivision: Subdivision | undefined = data.subdivisionsKeyByCode.get(subdivisionCode)
    if (!subdivision) {
      errors.push(`There is no subdivision with the code "${subdivisionCode}" in the database`)
    }
  }

  if (dataSet.has('wikidata_id')) {
    errors = errors.concat(dataSet.validate('wikidata_id', ['validWikidataId']))
  }
}

function validateRemoveLogoRequest(dataSet: DataSet) {
  const logoUrl = dataSet.getString('logo_url')?.trim()
  if (!logoUrl) {
    errors.push('The request is missing the "Logo URL"')
    done()
  } else {
    const channelId = dataSet.getString('channel_id')?.trim()
    const feedId = dataSet.getString('feed_id')?.trim()
    let logos = data.logosGroupedByUrl.get(logoUrl) || []
    if (!logos.length) {
      errors.push(`There is no logos with the URL "${logoUrl}" in the database`)
      done()
    } else if (channelId) {
      logos = logos.filter(logo => logo.channel === channelId)
      if (!logos.length) {
        errors.push(
          `There is no logos with the URL "${logoUrl}" and channel ID "${channelId}" in the database`
        )
        done()
      } else if (feedId) {
        logos = logos.filter(logo => logo.feed === feedId)
        if (!logos.length) {
          errors.push(
            `There is no logos with the URL "${logoUrl}", channel ID "${channelId}" and feed ID "${feedId}" in the database`
          )
          done()
        }
      }
    }
  }
}

function validateEditLogoRequest(dataSet: DataSet) {
  const logoUrl = dataSet.getString('logo_url')?.trim()
  if (!logoUrl) {
    errors.push('The request is missing the "Logo URL"')
    done()
  } else {
    const channelId = dataSet.getString('channel_id')?.trim()
    const feedId = dataSet.getString('feed_id')?.trim()
    let logos = data.logosGroupedByUrl.get(logoUrl) || []
    if (!logos.length) {
      errors.push(`There is no logos with the URL "${logoUrl}" in the database`)
      done()
    } else if (channelId) {
      logos = logos.filter(logo => logo.channel === channelId)
      if (!logos.length) {
        errors.push(
          `There is no logos with the URL "${logoUrl}" and channel ID "${channelId}" in the database`
        )
        done()
      } else if (feedId) {
        logos = logos.filter(logo => logo.feed === feedId)
        if (!logos.length) {
          errors.push(
            `There is no logos with the URL "${logoUrl}", channel ID "${channelId}" and feed ID "${feedId}" in the database`
          )
          done()
        }
      }
    }
  }

  if (
    dataSet.missing([
      'new_channel_id',
      'new_feed_id',
      'in_use',
      'width',
      'height',
      'format',
      'tags'
    ])
  ) {
    errors.push('The request does not contain any changes')
    done()
  }

  const newChannelId = dataSet.getString('new_channel_id')?.trim()

  if (newChannelId && dataSet.missing('channel_id')) {
    errors.push('To apply "New Channel ID" the request must include the current "Channel ID"')
    done()
  }

  const newFeedId = dataSet.getString('new_feed_id')?.trim()
  const oldChannelId = dataSet.getString('channel_id')
  const channelId = newChannelId || oldChannelId

  if (newFeedId && !channelId) {
    errors.push(
      'To apply "New Feed ID" the request must include the "Channel ID" or "New Channel ID"'
    )
    done()
  }

  const streamId = createStreamId(channelId, newFeedId)
  if (streamId) {
    const found = data.feedsKeyByStreamId.get(streamId)
    if (!found) {
      errors.push(
        `There is no feed with the ID "${newFeedId}" for the channel "${channelId}" in the database`
      )
      done()
    }
  }

  validateChannelData(dataSet)
  validateLogoData(dataSet)
}

function validateAddLogoRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }
  }

  const feedId = dataSet.getString('feed_id')
  if (channelId && feedId) {
    const streamId = createStreamId(channelId, feedId)
    if (streamId) {
      const found = data.feedsKeyByStreamId.get(streamId)
      if (!found) {
        errors.push(
          `There is no feed with the ID "${feedId}" for the channel "${channelId}" in the database`
        )
        done()
      }
    }
  }

  const logoUrl = dataSet.getString('logo_url')?.trim()
  if (!logoUrl) {
    errors.push('The request is missing the "Logo URL"')
    done()
  }

  validateLogoData(dataSet)
}

function validateRemoveFeedRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }
  }

  const feedId = dataSet.getString('feed_id')
  if (!feedId) {
    errors.push('The request is missing the "Feed ID"')
    done()
  }

  if (channelId && feedId) {
    const streamId = createStreamId(channelId, feedId)
    if (streamId) {
      const found = data.feedsKeyByStreamId.get(streamId)
      if (!found) {
        errors.push(
          `There is no feed with the ID "${feedId}" for the channel "${channelId}" in the database`
        )
        done()
      }
    }
  }
}

function validateEditFeedRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }
  }

  const feedId = dataSet.getString('feed_id')
  if (!feedId) {
    errors.push('The request is missing the "Feed ID"')
    done()
  }

  if (channelId && feedId) {
    const streamId = createStreamId(channelId, feedId)
    if (streamId) {
      const found = data.feedsKeyByStreamId.get(streamId)
      if (!found) {
        errors.push(
          `There is no feed with the ID "${feedId}" for the channel "${channelId}" in the database`
        )
        done()
      }
    }
  }

  const feedName = dataSet.getString('feed_name')
  if (feedName && channelId) {
    const newFeedId = createFeedId(feedName)
    const newStreamId = createStreamId(channelId, newFeedId)
    if (newStreamId && data.feedsKeyByStreamId.get(newStreamId)) {
      errors.push(
        `The database already contains a feed with name "${feedName}" for the channel "${channelId}"`
      )
      done()
    }
  }

  if (
    dataSet.missing([
      'feed_name',
      'alt_names',
      'is_main',
      'broadcast_area',
      'timezones',
      'languages',
      'format'
    ])
  ) {
    errors.push('The request does not contain any changes')
    done()
  }

  validateFeedData(dataSet)
}

function validateAddFeedRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }
  }

  if (dataSet.missing('feed_name')) {
    errors.push('The request is missing the "Feed Name"')
    done()
  }

  if (dataSet.missing('broadcast_area')) {
    errors.push('The request is missing the "Broadcast Area"')
    done()
  }

  if (dataSet.missing('timezones')) {
    errors.push('The request is missing the "Timezones"')
    done()
  }

  if (dataSet.missing('languages')) {
    errors.push('The request is missing the "Languages"')
    done()
  }

  dataSet.set('feed_alt_names', dataSet.getRaw('alt_names'))

  validateFeedData(dataSet)
  validateLogoData(dataSet)
}

function validateRemoveChannelRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')?.trim()
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }
  }

  validateChannelData(dataSet)
}

function validateAddChannelRequest(dataSet: DataSet) {
  const channelName = dataSet.getString('channel_name')?.trim()
  if (!channelName) {
    errors.push('The request is missing the "Channel Name"')
    done()
  }

  const countryCode = dataSet.getString('country')
  if (!countryCode) {
    errors.push('The request is missing the "Country"')
    done()
  }

  const channelId = createChannelId(channelName, countryCode)
  if (channelId && data.channelsKeyById.get(channelId)) {
    errors.push(
      `The database already contains a channel with name "${channelName}" and country code "${countryCode}"`
    )
    done()
  }

  if (dataSet.missing('feed_name')) {
    errors.push('The request is missing the "Feed Name"')
    done()
  }

  if (dataSet.missing('broadcast_area')) {
    errors.push('The request is missing the "Broadcast Area"')
    done()
  }

  if (dataSet.missing('timezones')) {
    errors.push('The request is missing the "Timezones"')
    done()
  }

  if (dataSet.missing('languages')) {
    errors.push('The request is missing the "Languages"')
    done()
  }

  if (dataSet.missing('logo_url')) {
    errors.push('The request is missing the "Logo URL"')
    done()
  }

  validateChannelData(dataSet)
  validateFeedData(dataSet)
  validateLogoData(dataSet)
}

function validateEditChannelRequest(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')
  if (!channelId) {
    errors.push('The request is missing the "Channel ID"')
    done()
  }

  const channelName = dataSet.getString('channel_name')
  const countryCode = dataSet.getString('country')
  const newChannelId = createChannelId(channelName, countryCode)
  if (newChannelId && data.channelsKeyById.get(newChannelId)) {
    errors.push(
      `The database already contains a channel with name "${channelName}" and country code "${countryCode}"`
    )
    done()
  }

  if (
    dataSet.missing([
      'alt_names',
      'network',
      'owners',
      'country',
      'categories',
      'is_nsfw',
      'launched',
      'closed',
      'replaced_by',
      'website'
    ])
  ) {
    errors.push('The request does not contain any changes')
    done()
  }

  validateChannelData(dataSet)
}

function validateLogoData(dataSet: DataSet) {
  if (dataSet.has('logo_url')) {
    errors = errors.concat(dataSet.validate('logo_url', ['validUrl']))
  }

  if (dataSet.has('tags')) {
    errors = errors.concat(dataSet.validate('tags', ['noCommas', 'noDoubleQuotes', 'noSpaces']))
  }

  if (dataSet.has('width')) {
    errors = errors.concat(dataSet.validate('width', ['validNumber']))
  }

  if (dataSet.has('height')) {
    errors = errors.concat(dataSet.validate('height', ['validNumber']))
  }
}

function validateFeedData(dataSet: DataSet) {
  const channelName = dataSet.getString('channel_name')
  const feedName = dataSet.getString('feed_name')

  if (feedName) {
    errors = errors.concat(
      dataSet.validate('feed_name', [
        'noCommas',
        'noDoubleQuotes',
        'noSpacedHyphen',
        'onlyLatinLetters'
      ])
    )
  }

  if (feedName && channelName && feedName.includes(channelName)) {
    errors.push('"Feed Name" should not contain "Channel Name"')
  }

  if (dataSet.has('feed_alt_names')) {
    errors = errors.concat(dataSet.validate('feed_alt_names', ['noCommas', 'noDoubleQuotes']))

    const feedAltNames = dataSet.getArray('feed_alt_names') || []
    feedAltNames.forEach(feedAltName => {
      if (feedAltName.trim() === feedName) {
        errors.push('The feed alternative name cannot be the same as the "Feed Name"')
      }

      if (feedAltName && channelName && feedAltName.includes(channelName)) {
        errors.push('The feed alternative name should not contain "Channel Name"')
      }
    })
  }

  const broadcastAreaCodes = dataSet.getArray('broadcast_area') || []
  if (broadcastAreaCodes.length) {
    errors = errors.concat(dataSet.validate('broadcast_area', ['noCommas', 'noDoubleQuotes']))
    broadcastAreaCodes
      .map(code => code.trim())
      .filter(Boolean)
      .forEach(rawCode => {
        const found: Location | undefined = data.locationsKeyByCode.get(rawCode)
        if (!found) {
          errors.push(`There is no location with the code "${rawCode}" in the database`)
        }
      })
  }

  const timezones = dataSet.getArray('timezones') || []
  if (timezones.length) {
    errors = errors.concat(dataSet.validate('timezones', ['noCommas', 'noDoubleQuotes']))
    timezones
      .map(id => id.trim())
      .filter(Boolean)
      .forEach(id => {
        const found: Timezone | undefined = data.timezonesKeyById.get(id)
        if (!found) {
          errors.push(`There is no timezone with the ID "${id}" in the database`)
        }
      })
  }

  const languages = dataSet.getArray('languages') || []
  if (languages.length) {
    errors = errors.concat(dataSet.validate('languages', ['noCommas', 'noDoubleQuotes']))
    languages
      .map(code => code.trim())
      .filter(Boolean)
      .forEach(code => {
        const found: Language | undefined = data.languagesKeyByCode.get(code)
        if (!found) {
          errors.push(`There is no language with the code "${code}" in the database`)
        }
      })
  }
}

function validateChannelData(dataSet: DataSet) {
  const channelId = dataSet.getString('channel_id')
  if (channelId) {
    const found = data.channelsKeyById.get(channelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
    }
  }

  const newChannelId = dataSet.getString('new_channel_id')
  if (newChannelId) {
    const found = data.channelsKeyById.get(newChannelId)
    if (!found) {
      errors.push(`There is no channel with the ID "${newChannelId}" in the database`)
    }
  }

  const channelName = dataSet.getString('channel_name')
  if (channelName) {
    errors = errors.concat(
      dataSet.validate('channel_name', [
        'noCommas',
        'noDoubleQuotes',
        'noSpacedHyphen',
        'onlyLatinLetters'
      ])
    )
  }

  if (dataSet.has('alt_names')) {
    errors = errors.concat(dataSet.validate('alt_names', ['noCommas', 'noDoubleQuotes']))

    const altNames = dataSet.getArray('alt_names') || []
    altNames.forEach(altName => {
      if (altName.trim() === channelName) {
        errors.push('The alternative name cannot be the same as the "Channel Name"')
      }
    })
  }

  if (dataSet.has('network')) {
    errors = errors.concat(dataSet.validate('network', ['noCommas', 'noDoubleQuotes']))
  }

  if (dataSet.has('owners')) {
    errors = errors.concat(dataSet.validate('owners', ['noCommas', 'noDoubleQuotes']))
  }

  const countryCode = dataSet.getString('country') || ''
  if (countryCode) {
    errors = errors.concat(dataSet.validate('country', ['noCommas', 'noDoubleQuotes']))
    const country: Country | undefined = data.countriesKeyByCode.get(countryCode)
    if (!country) {
      errors.push(`There is no country with the code "${countryCode}" in the database`)
    }
  }

  const categories = dataSet.getArray('categories') || []
  categories
    .map(categoryId => categoryId.trim())
    .filter(Boolean)
    .forEach(categoryId => {
      const found: Category | undefined = data.categoriesKeyById.get(categoryId)
      if (!found) {
        errors.push(`There is no category with the ID "${categoryId}" in the database`)
      }
    })

  const launched = dataSet.getString('launched')
  if (launched) {
    errors = errors.concat(
      dataSet.validate('launched', ['validDateFormat', 'validDate', 'dateBeforeToday'])
    )
  }

  const closed = dataSet.getString('closed')
  if (closed) {
    errors = errors.concat(
      dataSet.validate('closed', ['validDateFormat', 'validDate', 'dateBeforeToday'])
    )

    if (launched) {
      if (dayjs(closed, 'YYYY-MM-DD').isBefore(dayjs(launched, 'YYYY-MM-DD'))) {
        errors.push('"Closed" cannot be a date before "Launched"')
      }
    }
  }

  const website = dataSet.getString('website')
  if (website) {
    errors = errors.concat(dataSet.validate('website', ['validUrl']))
  }
}

function done() {
  if (errors.length) {
    let message = 'The request contains error(s):'
    errors.forEach(error => {
      message += `\r\n- ${error}`
    })
    logsStorage.saveSync('errors.txt', message)
    process.exit(1)
  }

  process.exit(0)
}

main()
