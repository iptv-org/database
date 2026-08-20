import { Channel, Feed, BlocklistRecord, Logo, City, Issue } from '../../models'
import { Collection, Logger } from '@freearhey/core'
import { ValidatorError } from '../../types/validator'
import { Storage } from '@freearhey/storage-js'
import { LOGS_DIR } from '../../constants'
import {
  createChannelId,
  createFeedId,
  loadIssues,
  probeImage,
  loadData,
  saveData,
  data,
  cacheData,
  resetData
} from '../../core'
import { DataSet } from '../../core/dataSet'

const processedIssues = new Collection<Issue>()
const skippedIssues = new Collection<Issue>()
const logger = new Logger({ level: 5 })

class LogThread {
  issue: Issue
  type: string

  constructor(issue: Issue, type: string) {
    this.issue = issue
    this.type = type
  }

  start() {
    console.log(`[#${this.issue.number}] ${this.type}: Issue #${this.issue.number}`)
  }

  warn(message: string) {
    console.log(`[#${this.issue.number}] ${this.type}: └── WARNING: ${message}`)
  }

  error(message: string) {
    console.log(`[#${this.issue.number}] ${this.type}: └── ERROR: ${message}`)
  }

  info(message: string) {
    console.log(`[#${this.issue.number}] ${this.type}: └── INFO: ${message}`)
  }
}

function createThread(issue: Issue, type: string): LogThread {
  return new LogThread(issue, type)
}

async function main() {
  logger.info('loading issues...')
  const issues = await loadIssues()

  logger.info('loading data...')
  await loadData()

  logger.info('processing issues...')
  await processIssues(issues)

  logger.info('saving data...')
  await saveData()

  logger.info('saving logs...')
  saveLogs()

  logger.info(
    `skipped ${skippedIssues.count()} issue(s): ${skippedIssues
      .map((issue: Issue) => `#${issue.number}`)
      .join(', ')}`
  )
  logger.info(
    `processed ${processedIssues.count()} issue(s): ${processedIssues
      .map((issue: Issue) => `#${issue.number}`)
      .join(', ')}`
  )
}

main()

function saveLogs() {
  const logStorage = new Storage(LOGS_DIR)
  const output = processedIssues.map((issue: Issue) => `closes #${issue.number}`).join(', ')
  logStorage.save('update.log', output)
}

async function processIssues(issues: Collection<Issue>) {
  const requests = issues.filter((issue: Issue) => issue.labels.includes('approved')).all()

  for (const issue of requests) {
    switch (true) {
      case issue.labels.includes('channels:add'):
        await addChannel(issue)
        break
      case issue.labels.includes('channels:edit'):
        await editChannel(issue)
        break
      case issue.labels.includes('channels:remove'):
        await removeChannel(issue)
        break
      case issue.labels.includes('logos:remove'):
        await removeLogo(issue)
        break
      case issue.labels.includes('logos:edit'):
        await editLogo(issue)
        break
      case issue.labels.includes('logos:add'):
        await addLogo(issue)
        break
      case issue.labels.includes('feeds:remove'):
        await removeFeed(issue)
        break
      case issue.labels.includes('feeds:edit'):
        await editFeed(issue)
        break
      case issue.labels.includes('feeds:add'):
        await addFeed(issue)
        break
      case issue.labels.includes('cities:remove'):
        await removeCity(issue)
        break
      case issue.labels.includes('cities:edit'):
        await editCity(issue)
        break
      case issue.labels.includes('cities:add'):
        await addCity(issue)
        break
      case issue.labels.includes('blocklist:remove'):
        await unblockChannel(issue)
        break
      case issue.labels.includes('blocklist:add'):
        await blockChannel(issue)
        break
    }
  }
}

async function addChannel(issue: Issue) {
  const log = createThread(issue, 'channels/add')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelName = dataSet.getString('channel_name')
  const country = dataSet.getString('country')
  const isNsfw = dataSet.getBoolean('is_nsfw')
  const logoUrl = dataSet.getString('logo_url')
  const feedName = dataSet.getString('feed_name')
  const broadcastArea = dataSet.getArray('broadcast_area')
  const timezones = dataSet.getArray('timezones')
  const languages = dataSet.getArray('languages')
  const videoFormat = dataSet.getString('format')

  if (
    !channelName ||
    !country ||
    isNsfw === undefined ||
    !logoUrl ||
    !feedName ||
    !broadcastArea ||
    !timezones ||
    !languages ||
    !videoFormat
  ) {
    log.error('The request contains incomplete data')
    skippedIssues.add(issue)
    return
  }

  const channelId = createChannelId(channelName, country)
  if (!channelId) {
    log.error('Failed to create channel id')
    return
  }

  const found: Channel = data.channels.first((channel: Channel) => channel.id === channelId)
  if (found) {
    log.error(`Channel with id "${channelId}" already exists`)
    skippedIssues.add(issue)
    return
  }

  const newChannel = new Channel({
    id: channelId,
    name: channelName,
    alt_names: dataSet.getArray('alt_names') || [],
    network: dataSet.getString('network') || null,
    owners: dataSet.getArray('owners') || [],
    country: country,
    categories: dataSet.getArray('categories') || [],
    is_nsfw: isNsfw,
    launched: dataSet.getString('launched') || null,
    closed: dataSet.getString('closed') || null,
    replaced_by: dataSet.getString('replaced_by') || null,
    website: dataSet.getString('website') || null
  })

  cacheData()

  data.channels.add(newChannel)
  data.channelsKeyById.set(newChannel.id, newChannel)

  const newFeed = new Feed({
    channel: newChannel.id,
    id: createFeedId(feedName),
    name: feedName,
    alt_names: dataSet.getArray('feed_alt_names') || [],
    is_main: true,
    broadcast_area: broadcastArea,
    timezones: timezones,
    languages: languages,
    format: videoFormat
  })
  data.feeds.add(newFeed)
  data.feedsKeyByStreamId.set(newFeed.getStreamId(), newFeed)
  const newChannelFeeds = data.feeds.filter((feed: Feed) => feed.channel === newChannel.id).all()
  data.feedsGroupedByChannelId.set(newChannel.id, newChannelFeeds)

  const imageInfo = await probeImage(logoUrl)
  const newLogo = new Logo({
    channel: newChannel.id,
    feed: null,
    in_use: dataSet.getBoolean('in_use') === false ? false : true,
    tags: dataSet.getArray('tags') || [],
    width: imageInfo.width,
    height: imageInfo.height,
    format: imageInfo.format,
    url: logoUrl
  })
  data.logos.add(newLogo)

  const errors = new Collection<ValidatorError>()
  errors.concat(newFeed.validate())
  errors.concat(newLogo.validate())
  errors.concat(newChannel.validate())
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  log.info(`Channel with id "${channelId}" added`)
  log.info(`Feed with channel "${newChannel.id}" and id "${newFeed.id}" added`)
  log.info(
    `Logo with channel "${newChannel.id}", feed "${newFeed.id}" and url "${newLogo.url}" added`
  )

  processedIssues.add(issue)
}

async function editChannel(issue: Issue) {
  const log = createThread(issue, 'channels/edit')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  if (!channelId) {
    log.error('The request is missing the channel ID')
    skippedIssues.add(issue)
    return
  }

  const foundChannel: Channel = data.channels.first(
    (channel: Channel) => channel.id === dataSet.getString('channel_id')
  )
  if (!foundChannel) {
    log.error(`Channel with id "${channelId}" not found`)
    skippedIssues.add(issue)
    return
  }

  cacheData()

  const updatedChannel = new Channel(foundChannel.toObject())
  updatedChannel.update(dataSet)

  log.info(`Channel with id "${channelId}" updated`)

  data.channels.remove((channel: Channel) => channel.id === foundChannel.id)
  data.channels.add(updatedChannel)

  if (foundChannel.id !== updatedChannel.id) onChannelIdChange(foundChannel, updatedChannel.id, log)

  const errors = updatedChannel.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  processedIssues.add(issue)
}

async function removeChannel(issue: Issue) {
  const log = createThread(issue, 'channels/remove')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  if (!channelId) {
    log.error('The request is missing the channel ID')
    skippedIssues.add(issue)
    return
  }

  const found: Channel = data.channels.first((channel: Channel) => channel.id === channelId)
  if (!found) {
    log.error(`Channel with id "${channelId}" not found`)
    skippedIssues.add(issue)
    return
  }

  data.channels.remove((channel: Channel) => channel.id === channelId)

  log.info(`Channel with id "${channelId}" removed`)

  onChannelRemoval(channelId, log)

  processedIssues.add(issue)
}
async function addFeed(issue: Issue) {
  const log = createThread(issue, 'feed/add')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  const feedName = dataSet.getString('feed_name')
  const format = dataSet.getString('format')
  const isMain = dataSet.getBoolean('is_main')
  const broadcastArea = dataSet.getArray('broadcast_area')
  const timezones = dataSet.getArray('timezones')
  const languages = dataSet.getArray('languages')

  if (
    !channelId ||
    !feedName ||
    isMain === undefined ||
    !broadcastArea ||
    !timezones ||
    !languages ||
    !format
  ) {
    log.error('The request contains incomplete data')
    skippedIssues.add(issue)
    return
  }

  const feedId = createFeedId(feedName)

  const foundFeed: Feed = data.feeds.first(
    (feed: Feed) => feed.channel === channelId && feed.id === feedId
  )
  if (foundFeed) {
    log.error(`Feed with id "${feedId} and channel "${channelId}" already exists`)
    skippedIssues.add(issue)
    return
  }

  const newFeed = new Feed({
    channel: channelId,
    id: feedId,
    name: feedName,
    alt_names: dataSet.getArray('alt_names') || [],
    is_main: isMain,
    broadcast_area: broadcastArea,
    timezones,
    languages,
    format
  })

  cacheData()

  data.feeds.add(newFeed)
  data.feedsKeyByStreamId.set(newFeed.getStreamId(), newFeed)

  log.info(`Feed with id "${feedId}" and channel "${channelId}" added`)

  if (newFeed.is_main === true) onFeedNewMain(channelId, feedId, log)

  const logoUrl = dataSet.getString('logo_url')
  if (logoUrl) {
    const imageInfo = await probeImage(logoUrl)
    const newLogo = new Logo({
      channel: channelId,
      feed: feedId,
      in_use: dataSet.getBoolean('in_use') === false ? false : true,
      tags: dataSet.getArray('tags') || [],
      width: imageInfo.width,
      height: imageInfo.height,
      format: imageInfo.format,
      url: logoUrl
    })
    data.logos.add(newLogo)
  }

  const errors = newFeed.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  processedIssues.add(issue)
}

async function editFeed(issue: Issue) {
  const log = createThread(issue, 'feeds/edit')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  const feedId = dataSet.getString('feed_id')

  if (!channelId) {
    log.error('The request is missing the channel ID')
    skippedIssues.add(issue)
    return
  }
  if (!feedId) {
    log.error('The request is missing the feed ID')
    skippedIssues.add(issue)
    return
  }

  const feed: Feed = data.feeds.first(
    (feed: Feed) => feed.channel === channelId && feed.id === feedId
  )

  if (!feed) {
    log.error(`Feed with id "${feedId}" and channel "${channelId}" not found`)
    skippedIssues.add(issue)
    return
  }

  const isMain = feed.is_main

  cacheData()

  feed.update(dataSet)

  data.feedsKeyByStreamId = data.feeds.keyBy((feed: Feed) => feed.getStreamId())
  data.feedsGroupedByChannelId = data.feeds.groupBy((feed: Feed) => feed.channel)

  log.info(`Feed with id "${feedId}" and channel "${channelId}" updated`)

  if (feedId !== feed.id) onFeedIdChange(feed.channel, feedId, feed.id, log)
  if (isMain !== feed.is_main) onFeedNewMain(channelId, feed.id, log)

  const errors = feed.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  processedIssues.add(issue)
}

async function removeFeed(issue: Issue) {
  const log = createThread(issue, 'feeds/remove')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  const feedId = dataSet.getString('feed_id')

  if (!channelId) {
    log.error('The request is missing the channel ID')
    skippedIssues.add(issue)
    return
  }
  if (!feedId) {
    log.error('The request is missing the feed ID')
    skippedIssues.add(issue)
    return
  }

  const foundFeed: Feed = data.feeds.first(
    (feed: Feed) => feed.channel === channelId && feed.id === feedId
  )
  if (!foundFeed) {
    log.error(`Feed with id "${feedId}" and channel "${channelId}" not found`)
    skippedIssues.add(issue)
    return
  }

  data.feeds.remove((feed: Feed) => feed.getStreamId() === foundFeed.getStreamId())
  data.feedsKeyByStreamId.remove(foundFeed.getStreamId())

  onFeedRemoval(channelId, feedId, log)

  log.info(`Feed with id "${feedId}" and channel "${channelId}" removed`)

  processedIssues.add(issue)
}

async function addLogo(issue: Issue) {
  const log = createThread(issue, 'logos/add')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  const feedId = dataSet.getString('feed_id') || null
  const logoUrl = dataSet.getString('logo_url')

  if (!channelId) {
    log.error('The request is missing the channel ID')
    skippedIssues.add(issue)
    return
  }
  if (!logoUrl) {
    log.error('The request is missing the logo url')
    skippedIssues.add(issue)
    return
  }

  const found: Logo = data.logos.first(
    (logo: Logo) => logo.channel === channelId && logo.feed === feedId && logo.url === logoUrl
  )

  if (found) {
    log.error(
      `Logo with channel "${channelId}", feed "${feedId}" and url "${logoUrl}" already exists`
    )
    skippedIssues.add(issue)
    return
  }

  const imageInfo = await probeImage(logoUrl)

  const newLogo = new Logo({
    channel: channelId,
    feed: feedId,
    url: logoUrl,
    in_use: dataSet.getBoolean('in_use') === false ? false : true,
    tags: dataSet.getArray('tags') || [],
    width: imageInfo.width,
    height: imageInfo.height,
    format: imageInfo.format
  })

  cacheData()
  data.logos.add(newLogo)

  log.info(`Logo with url "${newLogo.url}" added`)

  const errors = newLogo.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  processedIssues.add(issue)
}

async function editLogo(issue: Issue) {
  const log = createThread(issue, 'logos/edit')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const logoUrl = dataSet.getString('logo_url')
  const logoChannelId = dataSet.getString('channel_id')
  const logoFeedId = dataSet.getString('feed_id')

  if (!logoUrl) {
    log.error('The request is missing the logo URL')
    skippedIssues.add(issue)
    return
  }

  let logosToUpdate: Collection<Logo> = data.logos.filter((logo: Logo) => logo.url === logoUrl)

  if (logoChannelId) {
    logosToUpdate = logosToUpdate.filter((logo: Logo) => logo.channel === logoChannelId)
  }

  if (logoFeedId) {
    logosToUpdate = logosToUpdate.filter((logo: Logo) => logo.feed === logoFeedId)
  }

  if (logosToUpdate.isEmpty()) {
    log.error(
      `Logo with url "${logoUrl}", channel "${logoChannelId}" and feed "${logoFeedId}" not found`
    )
    skippedIssues.add(issue)
    return
  }

  log.info(
    `Found ${logosToUpdate.count()} logo(s) with url "${logoUrl}", channel "${logoChannelId}" and feed "${logoFeedId}"`
  )

  cacheData()

  for (const foundLogo of logosToUpdate.all()) {
    foundLogo.update(dataSet)

    const errors = foundLogo.validate()
    if (errors.isNotEmpty()) {
      errors.forEach((err: ValidatorError) => {
        log.error(err.message)
      })
      skippedIssues.add(issue)
      resetData()
      log.info('All changes have been reverted')
      return
    }
  }

  log.info(
    `Logo(s) with url "${logoUrl}", channel "${logoChannelId}" and feed "${logoFeedId}" updated`
  )

  processedIssues.add(issue)
}

async function removeLogo(issue: Issue) {
  const log = createThread(issue, 'logos/remove')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  const feedId = dataSet.getString('feed_id')
  const logoUrls = dataSet.getArray('logo_url') || []

  if (!logoUrls.length) {
    log.error('List of logos is empty')
    skippedIssues.add(issue)
    return
  }

  log.info(`The request contains ${logoUrls.length} url(s)`)

  logoUrls.forEach((logoUrl: string) => {
    const foundLogo = data.logos.first((logo: Logo) => {
      let result = logo.url === logoUrl
      if (channelId) result = result && logo.channel === channelId
      if (feedId) result = result && logo.feed === feedId

      return result
    })
    if (!foundLogo) {
      log.warn(`Logo with url "${logoUrl}", channel "${channelId}" and feed "${feedId}" not found`)
      return
    }

    data.logos.remove((logo: Logo) => {
      let result = logo.url === logoUrl
      if (channelId) result = result && logo.channel === channelId
      if (feedId) result = result && logo.feed === feedId

      if (result) {
        log.info(`Logo with url "${logoUrl}", channel "${channelId}" and feed "${feedId}" removed`)
      }

      return result
    })
  })

  processedIssues.add(issue)
}

async function addCity(issue: Issue) {
  const log = createThread(issue, 'cities/add')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const cityCode = dataSet.getString('city_code')
  const country = dataSet.getString('country')
  const cityName = dataSet.getString('city_name')
  const wikidataId = dataSet.getString('wikidata_id')
  const subdivision = dataSet.getString('subdivision')

  if (!country || !cityName || !cityCode || !wikidataId) {
    log.error('The request contains incomplete data')
    skippedIssues.add(issue)
    return
  }

  const foundCity: City = data.cities.first((city: City) => city.code === cityCode)
  if (foundCity) {
    log.error(`City with code "${cityCode}" already exists`)
    skippedIssues.add(issue)
    return
  }

  const newCity = new City({
    code: cityCode,
    name: cityName,
    country: country,
    subdivision: subdivision || null,
    wikidata_id: wikidataId
  })

  cacheData()
  data.cities.add(newCity)

  log.info(`City with code "${cityCode}" added`)

  const errors = newCity.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  processedIssues.add(issue)
}

async function editCity(issue: Issue) {
  const log = createThread(issue, 'cities/edit')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const cityCode = dataSet.getString('city_code')
  if (!cityCode) {
    log.error('The request is missing the city code')
    skippedIssues.add(issue)
    return
  }

  const foundCity: City = data.cities.first((city: City) => city.code === cityCode)
  if (!foundCity) {
    log.error(`City with code "${cityCode}" not found`)
    skippedIssues.add(issue)
    return
  }

  const updatedCity = new City(foundCity.toObject())
  updatedCity.update(dataSet)

  cacheData()
  data.cities.remove((city: City) => city.code === cityCode)
  data.cities.add(updatedCity)

  log.info(`City with code "${cityCode}" updated`)

  const errors = updatedCity.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  processedIssues.add(issue)
}

async function removeCity(issue: Issue) {
  const log = createThread(issue, 'cities/remove')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const cityCode = dataSet.getString('city_code')
  if (!cityCode) {
    log.error('The request is missing the city code')
    skippedIssues.add(issue)
    return
  }

  const foundCity: City = data.cities.first((city: City) => city.code === cityCode)
  if (!foundCity) {
    log.error(`City with code "${cityCode}" not found`)
    skippedIssues.add(issue)
    return
  }

  data.cities.remove((city: City) => city.code === cityCode)

  log.info(`City with code "${cityCode}" removed`)

  const broadcastAreaCode = `ct/${cityCode}`
  data.feeds.forEach((feed: Feed) => {
    if (feed.broadcast_area.includes(broadcastAreaCode)) {
      feed.broadcast_area = feed.broadcast_area.filter(
        (areaCode: string) => areaCode !== broadcastAreaCode
      )
    }
  })
  log.info(`Feed(s) with broadcast_area "${broadcastAreaCode}" has beed updated`)

  data.feedsGroupedByChannelId = data.feeds.groupBy((feed: Feed) => feed.channel)
  data.feedsKeyByStreamId = data.feeds.keyBy((feed: Feed) => feed.getStreamId())

  processedIssues.add(issue)
}

async function blockChannel(issue: Issue) {
  const log = createThread(issue, 'blocklist/add')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')
  const reason = dataSet.getString('reason')?.toLowerCase()
  const ref = dataSet.getString('ref')

  if (!channelId || !reason || !ref) {
    log.error('The request contains incomplete data')
    skippedIssues.add(issue)
    return
  }

  const found: BlocklistRecord = data.blocklistRecords.first(
    (record: BlocklistRecord) => record.channel === channelId && record.ref === ref && record.reason
  )
  if (found) {
    log.error(
      `Record with channel "${channelId}", reason "${reason}" and ref "${ref}" already exists`
    )
    skippedIssues.add(issue)
    return
  }

  const newRecord = new BlocklistRecord({
    channel: channelId,
    reason,
    ref
  })

  const errors = newRecord.validate()
  if (errors.isNotEmpty()) {
    errors.forEach((err: ValidatorError) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    return
  }

  data.blocklistRecords.add(newRecord)

  log.info(`Channel with id "${channelId}" blocked`)

  processedIssues.add(issue)
}

async function unblockChannel(issue: Issue) {
  const log = createThread(issue, 'blocklist/remove')
  log.start()

  const dataSet: DataSet = issue.dataSet

  const channelId = dataSet.getString('channel_id')

  if (!channelId) {
    log.error('The request is missing the channel ID')
    skippedIssues.add(issue)
    return
  }

  const foundRecord: BlocklistRecord = data.blocklistRecords.first(
    (record: BlocklistRecord) => record.channel === channelId
  )
  if (!foundRecord) {
    log.error(`Record with channel "${channelId}" not found`)
    skippedIssues.add(issue)
    return
  }

  data.blocklistRecords.remove(
    (blocklistRecord: BlocklistRecord) => blocklistRecord.channel === foundRecord.channel
  )

  log.info(`Channel with id "${channelId}" unblocked`)

  processedIssues.add(issue)
}

function onFeedIdChange(channelId: string, feedId: string, newFeedId: string, log: LogThread) {
  data.logos.forEach((logo: Logo) => {
    if (logo.channel === channelId && logo.feed === feedId) {
      logo.feed = newFeedId
    }
  })
  log.info(`Logo(s) with channel "${channelId}" and feed "${feedId}" updated`)

  data.channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by === `${channelId}@${feedId}`) {
      channel.replaced_by = `${channelId}@${newFeedId}`
    }
  })
  log.info(`Channel(s) with replaced_by "${channelId}@${feedId}" updated`)
}

function onFeedNewMain(channelId: string, feedId: string, log: LogThread) {
  data.feeds.forEach((feed: Feed) => {
    if (feed.channel === channelId && feed.id !== feedId && feed.is_main === true) {
      feed.is_main = false
    }
  })
  log.info(`Feed(s) with channel "${channelId}", feed "${feedId}" and is_main "true" updated`)
}

function onChannelIdChange(channel: Channel, newChannelId: string, log: LogThread) {
  data.channels.forEach((_channel: Channel) => {
    if (_channel.replaced_by && _channel.replaced_by.includes(channel.id)) {
      _channel.replaced_by = _channel.replaced_by.replace(channel.id, newChannelId)
    }
  })
  log.info(`Channel(s) with replaced_by "${channel.id}" updated`)

  data.feeds.forEach((feed: Feed) => {
    if (feed.channel === channel.id) {
      feed.channel = newChannelId
    }
  })
  log.info(`Feed(s) with channel "${channel.id}" updated`)

  data.logos.forEach((logo: Logo) => {
    if (logo.channel === channel.id) {
      logo.channel = newChannelId
    }
  })
  log.info(`Logo(s) with channel "${channel.id}" updated`)

  data.blocklistRecords.forEach((blocklistRecord: BlocklistRecord) => {
    if (blocklistRecord.channel === channel.id) {
      blocklistRecord.channel = newChannelId
    }
  })
  log.info(`Blocklist record(s) with channel "${channel.id}" updated`)

  data.channelsKeyById = data.channels.keyBy((channel: Channel) => channel.id)
  data.feedsGroupedByChannelId = data.feeds.groupBy((feed: Feed) => feed.channel)
  data.feedsKeyByStreamId = data.feeds.keyBy((feed: Feed) => feed.getStreamId())
}

function onFeedRemoval(channelId: string, feedId: string, log: LogThread) {
  data.channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by === `${channelId}@${feedId}`) {
      channel.replaced_by = null
    }
  })
  log.info(`Channel(s) with replaced_by "${channelId}@${feedId}" updated`)

  data.logos.remove((logo: Logo) => logo.channel === channelId && logo.feed === feedId)
  log.info(`Logo(s) with channel "${channelId}" and feed "${feedId}" removed`)
}

function onChannelRemoval(channelId: string, log: LogThread) {
  data.feeds.remove((feed: Feed) => feed.channel === channelId)
  log.info(`Feed(s) with channel "${channelId}" removed`)

  data.logos.remove((logo: Logo) => logo.channel === channelId)
  log.info(`Logo(s) with channel "${channelId}" removed`)

  data.blocklistRecords.remove((record: BlocklistRecord) => record.channel === channelId)
  log.info(`Blocklist record(s) with channel "${channelId}" removed`)

  data.channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by.includes(channelId)) {
      channel.replaced_by = null
    }
  })
  log.info(`Channel(s) with replaced_by "${channelId}" updated`)

  data.channelsKeyById.remove(channelId)
  data.feedsGroupedByChannelId.remove(channelId)
  data.feedsKeyByStreamId = data.feeds.keyBy((feed: Feed) => feed.getStreamId())
}
