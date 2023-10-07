import { CSV, IssueLoader, CSVParser } from '../core'
import { Channel, Blocked, Issue } from '../models'
import { DATA_DIR } from '../constants'
import { Storage, Collection } from '@freearhey/core'

let blocklist = new Collection()
let channels = new Collection()
const processedIssues = new Collection()

async function main() {
  const dataStorage = new Storage(DATA_DIR)
  const parser = new CSVParser()

  const _channels = await dataStorage.load('channels.csv')
  channels = (await parser.parse(_channels)).map(data => new Channel(data))

  const _blocklist = await dataStorage.load('blocklist.csv')
  blocklist = (await parser.parse(_blocklist)).map(data => new Blocked(data))

  const loader = new IssueLoader()

  await removeChannels({ loader })
  await editChannels({ loader })
  await addChannels({ loader })
  await blockChannels({ loader })
  await unblockChannels({ loader })

  channels = channels.orderBy([(channel: Channel) => channel.id], ['asc'])
  const channelsOutput = new CSV({ items: channels }).toString()
  await dataStorage.save('channels.csv', channelsOutput)

  blocklist = blocklist.orderBy([record => record.channel.toLowerCase()], ['asc'])
  const blocklistOutput = new CSV({ items: blocklist }).toString()
  await dataStorage.save('blocklist.csv', blocklistOutput)

  const output = processedIssues.map((issue: Issue) => `closes #${issue.number}`).join(', ')
  process.stdout.write(`OUTPUT=${output}`)
}

main()

async function removeChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['channels:remove,approved'] })
  issues.forEach((issue: Issue) => {
    if (issue.data.missing('channel_id')) return

    const found = channels.first((channel: Channel) => channel.id === issue.data.get('channel_id'))
    if (!found) return

    channels.remove((channel: Channel) => channel.id === found.id)

    processedIssues.push(issue)
  })
}

async function editChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['channels:edit,approved'] })
  issues.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channel_id')) return

    const found: Channel = channels.first(
      (channel: Channel) => channel.id === data.get('channel_id')
    )
    if (!found) return

    let channelId = found.id
    if (data.has('name') || data.has('country')) {
      const name = data.get('name') || found.name
      const country = data.get('country') || found.country
      channelId = generateChannelId(name, country)
    }

    found.update({
      id: channelId,
      name: data.get('name'),
      alt_names: data.get('alt_names'),
      network: data.get('network'),
      owners: data.get('owners'),
      country: data.get('country'),
      subdivision: data.get('subdivision'),
      city: data.get('city'),
      broadcast_area: data.get('broadcast_area'),
      languages: data.get('languages'),
      categories: data.get('categories'),
      is_nsfw: data.get('is_nsfw'),
      launched: data.get('launched'),
      closed: data.get('closed'),
      replaced_by: data.get('replaced_by'),
      website: data.get('website'),
      logo: data.get('logo')
    })

    processedIssues.push(issue)
  })
}

async function addChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['channels:add,approved'] })
  issues.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('name') || data.missing('country')) return

    const channelId = generateChannelId(data.get('name'), data.get('country'))

    const found: Channel = channels.first((channel: Channel) => channel.id === channelId)
    if (found) return

    channels.push(
      new Channel({
        id: channelId,
        name: data.get('name'),
        alt_names: data.get('alt_names'),
        network: data.get('network'),
        owners: data.get('owners'),
        country: data.get('country'),
        subdivision: data.get('subdivision'),
        city: data.get('city'),
        broadcast_area: data.get('broadcast_area'),
        languages: data.get('languages'),
        categories: data.get('categories'),
        is_nsfw: data.get('is_nsfw'),
        launched: data.get('launched'),
        closed: data.get('closed'),
        replaced_by: data.get('replaced_by'),
        website: data.get('website'),
        logo: data.get('logo')
      })
    )

    processedIssues.push(issue)
  })
}

async function unblockChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['blocklist:remove,approved'] })
  issues.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channel_id')) return

    const found: Blocked = blocklist.first(
      (blocked: Blocked) => blocked.channel === data.get('channel_id')
    )
    if (!found) return

    blocklist.remove((blocked: Blocked) => blocked.channel === found.channel)

    processedIssues.push(issue)
  })
}

async function blockChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['blocklist:add,approved'] })
  issues.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channel_id')) return

    const found: Blocked = blocklist.first(
      (blocked: Blocked) => blocked.channel === data.get('channel_id')
    )
    if (found) return

    blocklist.push(
      new Blocked({
        channel: data.get('channel_id'),
        ref: data.get('ref')
      })
    )

    processedIssues.push(issue)
  })
}

function generateChannelId(name: string, country: string): string {
  const slug = name
    .replace(/\+/gi, 'Plus')
    .replace(/^@/gi, 'At')
    .replace(/[^a-z\d]+/gi, '')
  country = country.toLowerCase()

  return `${slug}.${country}`
}
