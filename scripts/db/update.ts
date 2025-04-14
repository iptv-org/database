import { CSV, IssueLoader, CSVParser, Issue, IssueData } from '../core'
import { Channel, Blocked, Feed } from '../models'
import { DATA_DIR } from '../constants'
import { Storage, Collection } from '@freearhey/core'
import { createChannelId, createFeedId } from '../utils'

let blocklist = new Collection()
let channels = new Collection()
let feeds = new Collection()
let issues = new Collection()
const processedIssues = new Collection()

async function main() {
  const dataStorage = new Storage(DATA_DIR)
  const parser = new CSVParser()
  const loader = new IssueLoader()

  issues = await loader.load()

  const channelsCSV = await dataStorage.load('channels.csv')
  channels = (await parser.parse(channelsCSV)).map(data => new Channel(data))

  const feedsCSV = await dataStorage.load('feeds.csv')
  feeds = (await parser.parse(feedsCSV)).map(data => new Feed(data))

  const blocklistCSV = await dataStorage.load('blocklist.csv')
  blocklist = (await parser.parse(blocklistCSV)).map(data => new Blocked(data))

  await removeFeeds()
  await removeChannels()
  await editFeeds()
  await editChannels()
  await addFeeds()
  await addChannels()
  await blockChannels()
  await unblockChannels()

  channels = channels.sortBy(channel => channel.id.toLowerCase())
  const channelsOutput = new CSV({ items: channels }).toString()
  await dataStorage.save('channels.csv', channelsOutput)

  feeds = feeds.sortBy(feed => `${feed.channel}@${feed.id}`.toLowerCase())
  const feedsOutput = new CSV({ items: feeds }).toString()
  await dataStorage.save('feeds.csv', feedsOutput)

  blocklist = blocklist.sortBy(blocked => blocked.channel.toLowerCase())
  const blocklistOutput = new CSV({ items: blocklist }).toString()
  await dataStorage.save('blocklist.csv', blocklistOutput)

  const output = processedIssues.map((issue: Issue) => `closes #${issue.number}`).join(', ')
  process.stdout.write(`OUTPUT=${output}`)
}

main()

async function removeFeeds() {
  const requests = issues.filter(
    issue => issue.labels.includes('feeds:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    if (issue.data.missing('channel_id') || issue.data.missing('feed_id')) return

    const found = feeds.first(
      (feed: Feed) =>
        feed.channel === issue.data.getString('channel_id') &&
        feed.id === issue.data.getString('feed_id')
    )
    if (!found) return

    feeds.remove((feed: Feed) => feed.channel === found.channel && feed.id === found.id)

    onFeedRemoval(found.channel, found.id)

    processedIssues.push(issue)
  })
}

async function editFeeds() {
  const requests = issues.filter(
    issue => issue.labels.includes('feeds:edit') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data: IssueData = issue.data
    if (data.missing('channel_id') || data.missing('feed_id')) return

    const found: Feed = feeds.first(
      (feed: Feed) =>
        feed.channel === data.getString('channel_id') && feed.id === data.getString('feed_id')
    )
    if (!found) return

    let channelId: string | undefined = found.channel
    let feedId: string | undefined = found.id
    if (data.has('feed_name')) {
      const name = data.getString('feed_name') || found.name
      if (name) {
        feedId = createFeedId(name)
        if (feedId) onFeedIdChange(found.channel, found.id, feedId)
      }
    }

    if (data.has('is_main')) {
      const isMain = data.getBoolean('is_main') || false
      if (isMain) onFeedNewMain(channelId, feedId)
    }

    if (!feedId || !channelId) return

    const updated = new Feed({
      channel: channelId,
      id: feedId,
      name: data.getString('feed_name'),
      is_main: data.getBoolean('is_main'),
      broadcast_area: data.getArray('broadcast_area'),
      timezones: data.getArray('timezones'),
      languages: data.getArray('languages'),
      video_format: data.getString('video_format')
    })

    found.merge(updated)

    processedIssues.push(issue)
  })
}

async function addFeeds() {
  const requests = issues.filter(
    issue => issue.labels.includes('feeds:add') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data: IssueData = issue.data

    if (
      data.missing('channel_id') ||
      data.missing('feed_name') ||
      data.missing('is_main') ||
      data.missing('broadcast_area') ||
      data.missing('timezones') ||
      data.missing('languages') ||
      data.missing('video_format')
    )
      return

    const channelId = data.getString('channel_id')
    const feedName = data.getString('feed_name') || 'SD'
    const feedId = createFeedId(feedName)
    if (!channelId || !feedId) return

    const found: Feed = feeds.first(
      (feed: Feed) => feed.channel === channelId && feed.id === feedId
    )
    if (found) return

    const isMain = data.getBoolean('is_main') || false
    if (isMain) onFeedNewMain(channelId, feedId)

    feeds.push(
      new Feed({
        channel: channelId,
        id: feedId,
        name: feedName,
        is_main: data.getBoolean('is_main'),
        broadcast_area: data.getArray('broadcast_area'),
        timezones: data.getArray('timezones'),
        languages: data.getArray('languages'),
        video_format: data.getString('video_format')
      })
    )

    processedIssues.push(issue)
  })
}

async function removeChannels() {
  const requests = issues.filter(
    issue => issue.labels.includes('channels:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    if (issue.data.missing('channel_id')) return

    const found = channels.first(
      (channel: Channel) => channel.id === issue.data.getString('channel_id')
    )
    if (!found) return

    channels.remove((channel: Channel) => channel.id === found.id)

    onChannelRemoval(found.id)

    processedIssues.push(issue)
  })
}

async function editChannels() {
  const requests = issues.filter(
    issue => issue.labels.includes('channels:edit') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data: IssueData = issue.data
    if (data.missing('channel_id')) return

    const found: Channel = channels.first(
      (channel: Channel) => channel.id === data.getString('channel_id')
    )
    if (!found) return

    let channelId: string | undefined = found.id
    if (data.has('channel_name') || data.has('country')) {
      const name = data.getString('channel_name') || found.name
      const country = data.getString('country') || found.country
      if (name && country) {
        channelId = createChannelId(name, country)
        if (channelId) onChannelIdChange(found.id, channelId)
      }
    }

    if (!channelId) return

    const updated = new Channel({
      id: channelId,
      name: data.getString('channel_name'),
      alt_names: data.getArray('alt_names'),
      network: data.getString('network'),
      owners: data.getArray('owners'),
      country: data.getString('country'),
      subdivision: data.getString('subdivision'),
      city: data.getString('city'),
      broadcast_area: data.getArray('broadcast_area'),
      languages: data.getArray('languages'),
      categories: data.getArray('categories'),
      is_nsfw: data.getBoolean('is_nsfw'),
      launched: data.getString('launched'),
      closed: data.getString('closed'),
      replaced_by: data.getString('replaced_by'),
      website: data.getString('website'),
      logo: data.getString('logo')
    })

    found.merge(updated)

    processedIssues.push(issue)
  })
}

async function addChannels() {
  const requests = issues.filter(
    issue => issue.labels.includes('channels:add') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data: IssueData = issue.data

    if (
      data.missing('channel_name') ||
      data.missing('country') ||
      data.missing('is_nsfw') ||
      data.missing('logo') ||
      data.missing('feed_name') ||
      data.missing('broadcast_area') ||
      data.missing('timezones') ||
      data.missing('languages') ||
      data.missing('video_format')
    )
      return

    const channelId = createChannelId(data.getString('channel_name'), data.getString('country'))
    if (!channelId) return

    const found: Channel = channels.first((channel: Channel) => channel.id === channelId)
    if (found) return

    channels.push(
      new Channel({
        id: channelId,
        name: data.getString('channel_name'),
        alt_names: data.getArray('alt_names'),
        network: data.getString('network'),
        owners: data.getArray('owners'),
        country: data.getString('country'),
        subdivision: data.getString('subdivision'),
        city: data.getString('city'),
        broadcast_area: data.getArray('broadcast_area'),
        languages: data.getArray('languages'),
        categories: data.getArray('categories'),
        is_nsfw: data.getBoolean('is_nsfw'),
        launched: data.getString('launched'),
        closed: data.getString('closed'),
        replaced_by: data.getString('replaced_by'),
        website: data.getString('website'),
        logo: data.getString('logo')
      })
    )

    const feedName = data.getString('feed_name') || 'SD'

    feeds.push(
      new Feed({
        channel: channelId,
        id: createFeedId(feedName),
        name: feedName,
        is_main: true,
        broadcast_area: data.getArray('broadcast_area'),
        timezones: data.getArray('timezones'),
        languages: data.getArray('languages'),
        video_format: data.getString('video_format'),
        launched: data.getString('launched'),
        closed: data.getString('closed'),
        replaced_by: data.getString('replaced_by')
      })
    )

    processedIssues.push(issue)
  })
}

async function unblockChannels() {
  const requests = issues.filter(
    issue => issue.labels.includes('blocklist:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channel_id')) return

    const found: Blocked = blocklist.first(
      (blocked: Blocked) => blocked.channel === data.getString('channel_id')
    )
    if (!found) return

    blocklist.remove((blocked: Blocked) => blocked.channel === found.channel)

    processedIssues.push(issue)
  })
}

async function blockChannels() {
  const requests = issues.filter(
    issue => issue.labels.includes('blocklist:add') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channel_id')) return

    const found: Blocked = blocklist.first(
      (blocked: Blocked) => blocked.channel === data.getString('channel_id')
    )
    if (found) return

    const channel = data.getString('channel_id')
    const reason = data.getString('reason')?.toLowerCase()
    const ref = data.getString('ref')
    if (!channel || !reason || !ref) return

    blocklist.push(
      new Blocked({
        channel,
        reason,
        ref
      })
    )

    processedIssues.push(issue)
  })
}

function onFeedIdChange(channelId: string, feedId: string, newFeedId: string) {
  channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by === `${channelId}@${feedId}`) {
      channel.replaced_by = `${channelId}@${newFeedId}`
    }
  })
}

function onFeedNewMain(channelId: string, feedId: string) {
  feeds.forEach((feed: Feed) => {
    if (feed.channel === channelId && feed.id !== feedId && feed.is_main === true) {
      feed.is_main = false
    }
  })
}

function onFeedRemoval(channelId: string, feedId: string) {
  channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by === `${channelId}@${feedId}`) {
      channel.replaced_by = ''
    }
  })
}

function onChannelIdChange(channelId: string, newChannelId: string) {
  channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by.includes(channelId)) {
      channel.replaced_by = channel.replaced_by.replace(channelId, newChannelId)
    }
  })

  feeds.forEach((feed: Feed) => {
    if (feed.channel === channelId) {
      feed.channel = newChannelId
    }
  })

  blocklist.forEach((blocked: Blocked) => {
    if (blocked.channel === channelId) {
      blocked.channel = newChannelId
    }
  })
}

function onChannelRemoval(channelId: string) {
  channels.forEach((channel: Channel) => {
    if (channel.replaced_by && channel.replaced_by.includes(channelId)) {
      channel.replaced_by = ''
    }
  })

  feeds.remove((feed: Feed) => feed.channel === channelId)
}
