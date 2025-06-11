import { CSV, IssueLoader, Issue, IssueData } from '../../core'
import { createChannelId, createFeedId } from '../../utils'
import { Channel, Feed, BlocklistRecord } from '../../models'
import { Storage, Collection, Logger } from '@freearhey/core'
import { DATA_DIR } from '../../constants'
import { DataLoader } from '../../core/dataLoader'
import { DataLoaderData } from '../../types/dataLoader'

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
  await removeFeeds(issues, data)
  await removeChannels(issues, data)
  await editFeeds(issues, data)
  await editChannels(issues, data)
  await addFeeds(issues, data)
  await addChannels(issues, data)
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
      issueData.missing('video_format')
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
      is_main: issueData.getBoolean('is_main') || false,
      broadcast_area: issueData.getArray('broadcast_area') || [],
      timezones: issueData.getArray('timezones') || [],
      languages: issueData.getArray('languages') || [],
      video_format: issueData.getString('video_format')
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

    if (issueData.missing('channel_id')) return

    const found = data.channels.first(
      (channel: Channel) => channel.id === issueData.getString('channel_id')
    )
    if (!found) return

    data.channels.remove((channel: Channel) => channel.id === found.id)

    onChannelRemoval(found.id, data)

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

  requests.forEach((issue: Issue) => {
    const issueData: IssueData = issue.data

    if (
      issueData.missing('channel_name') ||
      issueData.missing('country') ||
      issueData.missing('is_nsfw') ||
      issueData.missing('logo') ||
      issueData.missing('feed_name') ||
      issueData.missing('broadcast_area') ||
      issueData.missing('timezones') ||
      issueData.missing('languages') ||
      issueData.missing('video_format')
    )
      return

    const channelId = createChannelId(
      issueData.getString('channel_name'),
      issueData.getString('country')
    )
    if (!channelId) return

    const found: Channel = data.channels.first((channel: Channel) => channel.id === channelId)
    if (found) return

    const newChannel = new Channel({
      id: channelId,
      name: issueData.getString('channel_name') || '',
      alt_names: issueData.getArray('alt_names'),
      network: issueData.getString('network'),
      owners: issueData.getArray('owners'),
      country: issueData.getString('country') || '',
      subdivision: issueData.getString('subdivision'),
      city: issueData.getString('city'),
      categories: issueData.getArray('categories'),
      is_nsfw: issueData.getBoolean('is_nsfw') || false,
      launched: issueData.getString('launched'),
      closed: issueData.getString('closed'),
      replaced_by: issueData.getString('replaced_by'),
      website: issueData.getString('website'),
      logo: issueData.getString('logo') || ''
    })
    data.channels.add(newChannel)

    const feedName = issueData.getString('feed_name') || 'SD'
    const newFeed = new Feed({
      channel: channelId,
      id: createFeedId(feedName),
      name: feedName,
      is_main: true,
      broadcast_area: issueData.getArray('broadcast_area') || [],
      timezones: issueData.getArray('timezones') || [],
      languages: issueData.getArray('languages') || [],
      video_format: issueData.getString('video_format')
    })
    data.feeds.add(newFeed)

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
}
