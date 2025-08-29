import { CSV, IssueLoader, Issue, IssueData, ImageProcessor } from '../../core'
import { Channel, Feed, BlocklistRecord, Logo, City } from '../../models'
import { Storage, Collection, Logger } from '@freearhey/core'
import { createChannelId, createFeedId } from '../../utils'
import { DataLoaderData } from '../../types/dataLoader'
import { DataLoader } from '../../core/dataLoader'
import { DATA_DIR } from '../../constants'

const processedIssues = new Collection()
const dataStorage = new Storage(DATA_DIR)
const logger = new Logger({ level: -999 })

async function main() {
  const issueLoader = new IssueLoader()
  const dataLoader = new DataLoader({ storage: dataStorage })

  logger.info('loading issues...')
  const issues = await issueLoader.load()

  logger.info('loading data...')
  const data = await dataLoader.load()

  logger.info('processing issues...')
  await removeLogos(issues, data)
  await editLogos(issues, data)
  await addLogos(issues, data)
  await removeFeeds(issues, data)
  await editFeeds(issues, data)
  await addFeeds(issues, data)
  await removeChannels(issues, data)
  await editChannels(issues, data)
  await addChannels(issues, data)
  await removeCities(issues, data)
  await editCities(issues, data)
  await addCities(issues, data)
  await blockChannels(issues, data)
  await unblockChannels(issues, data)

  logger.info('saving data...')
  await save(data)

  const output = processedIssues.map((issue: Issue) => `closes #${issue.number}`).join(', ')
  process.stdout.write(`OUTPUT=${output}`)
}

main()

async function save(data: DataLoaderData) {
  const channels = data.channels
    .sortBy((channel: Channel) => channel.id.toLowerCase())
    .map((channel: Channel) => channel.data())
  const channelsOutput = new CSV({ items: channels }).toString()
  await dataStorage.save('channels.csv', channelsOutput)

  const feeds = data.feeds
    .sortBy((feed: Feed) => `${feed.getStreamId()}`.toLowerCase())
    .map((feed: Feed) => feed.data())
  const feedsOutput = new CSV({ items: feeds }).toString()
  await dataStorage.save('feeds.csv', feedsOutput)

  const blocklistRecords = data.blocklistRecords
    .sortBy((blocklistRecord: BlocklistRecord) => blocklistRecord.channelId.toLowerCase())
    .map((blocklistRecord: BlocklistRecord) => blocklistRecord.data())
  const blocklistOutput = new CSV({ items: blocklistRecords }).toString()
  await dataStorage.save('blocklist.csv', blocklistOutput)

  const logos = data.logos
    .sortBy((logo: Logo) => `${logo.channelId}${logo.feedId}${logo.url}`.toLowerCase())
    .map((logo: Logo) => logo.data())
  const logosOutput = new CSV({ items: logos }).toString()
  await dataStorage.save('logos.csv', logosOutput)

  const cities = data.cities
    .orderBy(
      (city: City) =>
        `${city.countryCode}_${city.subdivisionCode || ''}_${city.code}`.toLowerCase(),
      'asc',
      true
    )
    .map((city: City) => city.data())
  const citiesOutput = new CSV({ items: cities }).toString()
  await dataStorage.save('cities.csv', citiesOutput)
}

async function removeLogos(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('logos:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    const logoUrls = issueData.getArray('logo_url') || []

    if (!logoUrls.length) return

    logoUrls.forEach((logoUrl: string) => {
      data.logos.remove((logo: Logo) => {
        let result = logo.url === logoUrl
        if (issueData.has('channel_id'))
          result = result && logo.channelId === issueData.getString('channel_id')
        if (issueData.has('feed_id'))
          result = result && logo.feedId === issueData.getString('feed_id')

        return result
      })
    })

    processedIssues.push(issue)
  })
}

async function editLogos(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('logos:edit') && issue.labels.includes('approved')
  )

  const imageProcessor = new ImageProcessor()
  for (const issue of requests.all()) {
    const issueData: IssueData = issue.data
    if (issueData.missing('logo_url')) continue

    const filtered: Collection = data.logos.filter((logo: Logo) => {
      let result = logo.url === issueData.getString('logo_url')
      if (issueData.has('channel_id'))
        result = result && logo.channelId === issueData.getString('channel_id')
      if (issueData.has('feed_id'))
        result = result && logo.feedId === issueData.getString('feed_id')

      return result
    })

    if (filtered.isEmpty()) continue

    for (const found of filtered.all()) {
      found.update(issueData)

      if (issueData.has('new_logo_url')) {
        const newLogoUrl = issueData.getString('new_logo_url')
        if (newLogoUrl) {
          const imageInfo = await imageProcessor.probe(newLogoUrl)
          found.setWidth(imageInfo.width)
          found.setHeight(imageInfo.height)
          found.setFormat(imageInfo.format)
        }
      }

      if (issueData.has('width')) found.setWidth(issueData.getNumber('width') || 0)
      if (issueData.has('height')) found.setHeight(issueData.getNumber('height') || 0)
      if (issueData.has('format')) found.setFormat(issueData.getString('format') || '')
    }

    processedIssues.push(issue)
  }
}

async function addLogos(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('logos:add') && issue.labels.includes('approved')
  )

  const imageProcessor = new ImageProcessor()
  for (const issue of requests.all()) {
    const issueData: IssueData = issue.data

    const channelId = issueData.getString('channel_id')
    const feedId = issueData.getString('feed_id') || ''
    const logoUrl = issueData.getString('logo_url')
    if (!channelId || !logoUrl) continue

    const found: Logo = data.logos.first(
      (logo: Logo) => logo.channelId === channelId && logo.feedId === feedId && logo.url === logoUrl
    )
    if (found) continue

    const imageInfo = await imageProcessor.probe(logoUrl)

    const newLogo = new Logo({
      channel: channelId,
      feed: feedId,
      url: logoUrl,
      tags: issueData.getArray('tags') || [],
      width: imageInfo.width,
      height: imageInfo.height,
      format: imageInfo.format
    })

    data.logos.add(newLogo)

    processedIssues.push(issue)
  }
}

async function removeFeeds(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('feeds:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    if (issueData.missing('channel_id') || issueData.missing('feed_id')) return

    const found: Feed = data.feeds.first(
      (feed: Feed) =>
        feed.channelId === issueData.getString('channel_id') &&
        feed.id === issueData.getString('feed_id')
    )
    if (!found) return

    data.feeds.remove((feed: Feed) => feed.channelId === found.channelId && feed.id === found.id)

    onFeedRemoval(found.channelId, found.id, data)

    processedIssues.push(issue)
  })
}

async function editFeeds(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('feeds:edit') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data
    if (issueData.missing('channel_id') || issueData.missing('feed_id')) return

    const found: Feed = data.feeds.first(
      (feed: Feed) =>
        feed.channelId === issueData.getString('channel_id') &&
        feed.id === issueData.getString('feed_id')
    )
    if (!found) return

    const channelId: string | undefined = found.channelId
    let feedId: string | undefined = found.id
    if (issueData.has('feed_name')) {
      const name = issueData.getString('feed_name') || found.name
      if (name) {
        feedId = createFeedId(name)
        if (feedId) onFeedIdChange(found.channelId, found.id, feedId, data)
      }
    }

    if (issueData.has('is_main')) {
      const isMain = issueData.getBoolean('is_main') || false
      if (isMain) onFeedNewMain(channelId, feedId, data)
    }

    if (!feedId || !channelId) return

    found.update(issueData).setId(feedId)

    processedIssues.push(issue)
  })
}

async function addFeeds(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('feeds:add') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    if (
      issueData.missing('channel_id') ||
      issueData.missing('feed_name') ||
      issueData.missing('is_main') ||
      issueData.missing('broadcast_area') ||
      issueData.missing('timezones') ||
      issueData.missing('languages') ||
      issueData.missing('format')
    )
      return

    const channelId = issueData.getString('channel_id')
    const feedName = issueData.getString('feed_name') || 'SD'
    const feedId = createFeedId(feedName)
    if (!channelId || !feedId) return

    const found: Feed = data.feeds.first(
      (feed: Feed) => feed.channelId === channelId && feed.id === feedId
    )
    if (found) return

    const isMain = issueData.getBoolean('is_main') || false
    if (isMain) onFeedNewMain(channelId, feedId, data)

    const newFeed = new Feed({
      channel: channelId,
      id: feedId,
      name: feedName,
      alt_names: issueData.getArray('alt_names') || [],
      is_main: issueData.getBoolean('is_main') || false,
      broadcast_area: issueData.getArray('broadcast_area') || [],
      timezones: issueData.getArray('timezones') || [],
      languages: issueData.getArray('languages') || [],
      format: issueData.getString('format')
    })

    data.feeds.add(newFeed)

    processedIssues.push(issue)
  })
}

async function removeChannels(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('channels:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    const channelId = issueData.getString('channel_id')

    if (!channelId) return

    data.channels.remove((channel: Channel) => channel.id === channelId)

    onChannelRemoval(channelId, data)

    processedIssues.push(issue)
  })
}

async function editChannels(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('channels:edit') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    if (issueData.missing('channel_id')) return

    const found: Channel = data.channels.first(
      (channel: Channel) => channel.id === issueData.getString('channel_id')
    )
    if (!found) return

    let channelId: string | undefined = found.id
    if (issueData.has('channel_name') || issueData.has('country')) {
      const name = issueData.getString('channel_name') || found.name
      const country = issueData.getString('country') || found.countryCode
      if (name && country) {
        channelId = createChannelId(name, country)
        if (channelId) onChannelIdChange(found.id, channelId, data)
      }
    }

    if (!channelId) return

    found.update(issueData).setId(channelId)

    processedIssues.push(issue)
  })
}

async function addChannels(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('channels:add') && issue.labels.includes('approved')
  )

  for (const issue of requests.all()) {
    const issueData: IssueData = issue.data

    if (
      issueData.missing('channel_name') ||
      issueData.missing('country') ||
      issueData.missing('is_nsfw') ||
      issueData.missing('logo_url') ||
      issueData.missing('feed_name') ||
      issueData.missing('broadcast_area') ||
      issueData.missing('timezones') ||
      issueData.missing('languages') ||
      issueData.missing('format')
    )
      continue

    const channelId = createChannelId(
      issueData.getString('channel_name'),
      issueData.getString('country')
    )
    if (!channelId) continue

    const found: Channel = data.channels.first((channel: Channel) => channel.id === channelId)
    if (found) continue

    const newChannel = new Channel({
      id: channelId,
      name: issueData.getString('channel_name') || '',
      alt_names: issueData.getArray('alt_names'),
      network: issueData.getString('network'),
      owners: issueData.getArray('owners'),
      country: issueData.getString('country') || '',
      categories: issueData.getArray('categories'),
      is_nsfw: issueData.getBoolean('is_nsfw') || false,
      launched: issueData.getString('launched'),
      closed: issueData.getString('closed'),
      replaced_by: issueData.getString('replaced_by'),
      website: issueData.getString('website')
    })
    data.channels.add(newChannel)

    await onChannelAddition(channelId, issueData, data)

    processedIssues.push(issue)
  }
}

async function removeCities(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('cities:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    const cityCode = issueData.getString('city_code')
    if (!cityCode) return

    const found: City = data.cities.first((city: City) => city.code === cityCode)
    if (!found) return

    data.cities.remove((city: City) => city.code === found.code)

    onCityRemoval(found.code, data)

    processedIssues.push(issue)
  })
}

async function editCities(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('cities:edit') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    const cityCode = issueData.getString('city_code')
    if (!cityCode) return

    const found: City = data.cities.first((city: City) => city.code === cityCode)
    if (!found) return

    found.update(issueData)

    processedIssues.push(issue)
  })
}

async function addCities(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('cities:add') && issue.labels.includes('approved')
  )

  for (const issue of requests.all()) {
    const issueData: IssueData = issue.data

    if (
      issueData.missing('country') ||
      issueData.missing('city_name') ||
      issueData.missing('city_code') ||
      issueData.missing('wikidata_id')
    )
      continue

    const cityCode = issueData.getString('city_code')
    if (!cityCode) continue

    const found: City = data.cities.first((city: City) => city.code === cityCode)
    if (found) continue

    const newCity = new City({
      code: cityCode,
      name: issueData.getString('city_name') || '',
      country: issueData.getString('country') || '',
      subdivision: issueData.getString('subdivision') || null,
      wikidata_id: issueData.getString('wikidata_id') || ''
    })
    data.cities.add(newCity)

    processedIssues.push(issue)
  }
}

async function blockChannels(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('blocklist:add') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    if (issueData.missing('channel_id')) return

    const found: BlocklistRecord = data.blocklistRecords.first(
      (blocklistRecord: BlocklistRecord) =>
        blocklistRecord.channelId === issueData.getString('channel_id')
    )
    if (found) return

    const channel = issueData.getString('channel_id')
    const reason = issueData.getString('reason')?.toLowerCase()
    const ref = issueData.getString('ref')
    if (!channel || !reason || !ref) return

    const newBlocklistRecord = new BlocklistRecord({
      channel,
      reason,
      ref
    })
    data.blocklistRecords.add(newBlocklistRecord)

    processedIssues.push(issue)
  })
}

async function unblockChannels(issues: Collection, data: DataLoaderData) {
  const requests = issues.filter(
    issue => issue.labels.includes('blocklist:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    if (issueData.missing('channel_id')) return

    const found: BlocklistRecord = data.blocklistRecords.first(
      (blocklistRecord: BlocklistRecord) =>
        blocklistRecord.channelId === issueData.getString('channel_id')
    )
    if (!found) return

    data.blocklistRecords.remove(
      (blocklistRecord: BlocklistRecord) => blocklistRecord.channelId === found.channelId
    )

    processedIssues.push(issue)
  })
}

function onFeedIdChange(
  channelId: string,
  feedId: string,
  newFeedId: string,
  data: DataLoaderData
) {
  data.channels.forEach((channel: Channel) => {
    if (channel.replacedBy && channel.replacedBy === `${channelId}@${feedId}`) {
      channel.replacedBy = `${channelId}@${newFeedId}`
    }
  })

  data.logos.forEach((logo: Logo) => {
    if (logo.channelId === channelId && logo.feedId === feedId) {
      logo.feedId = newFeedId
    }
  })
}

function onFeedNewMain(channelId: string, feedId: string, data: DataLoaderData) {
  data.feeds.forEach((feed: Feed) => {
    if (feed.channelId === channelId && feed.id !== feedId && feed.isMain === true) {
      feed.isMain = false
    }
  })
}

function onFeedRemoval(channelId: string, feedId: string, data: DataLoaderData) {
  data.channels.forEach((channel: Channel) => {
    if (channel.replacedBy && channel.replacedBy === `${channelId}@${feedId}`) {
      channel.replacedBy = ''
    }
  })

  data.logos.remove((logo: Logo) => logo.channelId === channelId && logo.feedId === feedId)
}

function onChannelIdChange(channelId: string, newChannelId: string, data: DataLoaderData) {
  data.channels.forEach((channel: Channel) => {
    if (channel.replacedBy && channel.replacedBy.includes(channelId)) {
      channel.replacedBy = channel.replacedBy.replace(channelId, newChannelId)
    }
  })

  data.feeds.forEach((feed: Feed) => {
    if (feed.channelId === channelId) {
      feed.channelId = newChannelId
    }
  })

  data.blocklistRecords.forEach((blocklistRecord: BlocklistRecord) => {
    if (blocklistRecord.channelId === channelId) {
      blocklistRecord.channelId = newChannelId
    }
  })

  data.logos.forEach((logo: Logo) => {
    if (logo.channelId === channelId) {
      logo.channelId = newChannelId
    }
  })
}

function onChannelRemoval(channelId: string, data: DataLoaderData) {
  data.channels.forEach((channel: Channel) => {
    if (channel.replacedBy && channel.replacedBy.includes(channelId)) {
      channel.replacedBy = ''
    }
  })

  data.feeds.remove((feed: Feed) => feed.channelId === channelId)

  data.blocklistRecords.remove(
    (blocklistRecord: BlocklistRecord) => blocklistRecord.channelId === channelId
  )

  data.logos.remove((logo: Logo) => logo.channelId === channelId)
}

async function onChannelAddition(channelId: string, issueData: IssueData, data: DataLoaderData) {
  const feedName = issueData.getString('feed_name') || 'SD'
  const newFeed = new Feed({
    channel: channelId,
    id: createFeedId(feedName),
    name: feedName,
    alt_names: [],
    is_main: true,
    broadcast_area: issueData.getArray('broadcast_area') || [],
    timezones: issueData.getArray('timezones') || [],
    languages: issueData.getArray('languages') || [],
    format: issueData.getString('format')
  })
  data.feeds.add(newFeed)

  const imageProcessor = new ImageProcessor()
  const logoUrl = issueData.getString('logo_url') || ''
  const imageInfo = await imageProcessor.probe(logoUrl)

  const newLogo = new Logo({
    channel: channelId,
    tags: [],
    width: imageInfo.width,
    height: imageInfo.height,
    format: imageInfo.format,
    url: logoUrl
  })
  data.logos.add(newLogo)
}

async function onCityRemoval(cityCode: string, data: DataLoaderData) {
  const broadcastAreaCode = `ct/${cityCode}`
  data.feeds.forEach((feed: Feed) => {
    if (feed.broadcastAreaCodes.includes(broadcastAreaCode)) {
      feed.broadcastAreaCodes = feed.broadcastAreaCodes.filter(
        (areaCode: string) => areaCode !== broadcastAreaCode
      )
    }
  })
}
