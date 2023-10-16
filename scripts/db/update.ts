import { CSV, IssueLoader, CSVParser, IDCreator, Issue, IssueData } from '../core'
import { Channel, Blocked } from '../models'
import { DATA_DIR } from '../constants'
import { Storage, Collection } from '@freearhey/core'

let blocklist = new Collection()
let channels = new Collection()
const processedIssues = new Collection()

async function main() {
  const idCreator = new IDCreator()
  const dataStorage = new Storage(DATA_DIR)
  const parser = new CSVParser()

  const _channels = await dataStorage.load('channels.csv')
  channels = (await parser.parse(_channels)).map(data => new Channel(data))

  const _blocklist = await dataStorage.load('blocklist.csv')
  blocklist = (await parser.parse(_blocklist)).map(data => new Blocked(data))

  const loader = new IssueLoader()

  await removeChannels({ loader })
  await editChannels({ loader, idCreator })
  await addChannels({ loader, idCreator })
  await blockChannels({ loader })
  await unblockChannels({ loader })

  channels = sortBy(channels, 'id')
  const channelsOutput = new CSV({ items: channels }).toString()
  await dataStorage.save('channels.csv', channelsOutput)

  blocklist = sortBy(blocklist, 'channel')
  const blocklistOutput = new CSV({ items: blocklist }).toString()
  await dataStorage.save('blocklist.csv', blocklistOutput)

  const output = processedIssues.map((issue: Issue) => `closes #${issue.number}`).join(', ')
  process.stdout.write(`OUTPUT=${output}`)
}

main()

function sortBy(channels: Collection, key: string) {
  const items = channels.all().sort((a, b) => {
    const normA = a[key].toLowerCase()
    const normB = b[key].toLowerCase()
    if (normA < normB) return -1
    if (normA > normB) return 1
    return 0
  })

  return new Collection(items)
}

async function removeChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['channels:remove,approved'] })
  issues.forEach((issue: Issue) => {
    if (issue.data.missing('channel_id')) return

    const found = channels.first(
      (channel: Channel) => channel.id === issue.data.getString('channel_id')
    )
    if (!found) return

    channels.remove((channel: Channel) => channel.id === found.id)

    processedIssues.push(issue)
  })
}

async function editChannels({ loader, idCreator }: { loader: IssueLoader; idCreator: IDCreator }) {
  const issues = await loader.load({ labels: ['channels:edit,approved'] })
  issues.forEach((issue: Issue) => {
    const data: IssueData = issue.data
    if (data.missing('channel_id')) return

    const found: Channel = channels.first(
      (channel: Channel) => channel.id === data.getString('channel_id')
    )
    if (!found) return

    let channelId = found.id
    if (data.has('name') || data.has('country')) {
      const name = data.getString('name') || found.name
      const country = data.getString('country') || found.country
      if (name && country) {
        channelId = idCreator.create(name, country)
      }
    }

    const updated = new Channel({
      id: channelId,
      name: data.getString('name'),
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

async function addChannels({ loader, idCreator }: { loader: IssueLoader; idCreator: IDCreator }) {
  const issues = await loader.load({ labels: ['channels:add,approved'] })
  issues.forEach((issue: Issue) => {
    const data: IssueData = issue.data
    const name = data.getString('name')
    const country = data.getString('country')

    if (!name || !country) return

    const channelId = idCreator.create(name, country)

    const found: Channel = channels.first((channel: Channel) => channel.id === channelId)
    if (found) return

    channels.push(
      new Channel({
        id: channelId,
        name: data.getString('name'),
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

    processedIssues.push(issue)
  })
}

async function unblockChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['blocklist:remove,approved'] })
  issues.forEach((issue: Issue) => {
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

async function blockChannels({ loader }: { loader: IssueLoader }) {
  const issues = await loader.load({ labels: ['blocklist:add,approved'] })
  issues.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channel_id')) return

    const found: Blocked = blocklist.first(
      (blocked: Blocked) => blocked.channel === data.getString('channel_id')
    )
    if (found) return

    const channel = data.getString('channel_id')
    const ref = data.getString('ref')
    if (!channel || !ref) return

    blocklist.push(
      new Blocked({
        channel,
        ref
      })
    )

    processedIssues.push(issue)
  })
}
