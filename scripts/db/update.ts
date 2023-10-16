import { CSV, IssueLoader, CSVParser, IDCreator } from '../core'
import { Channel, Blocked, Issue } from '../models'
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

    const found = channels.first((channel: Channel) => channel.id === issue.data.get('channel_id'))
    if (!found) return

    channels.remove((channel: Channel) => channel.id === found.id)

    processedIssues.push(issue)
  })
}

async function editChannels({ loader, idCreator }: { loader: IssueLoader; idCreator: IDCreator }) {
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
      channelId = idCreator.create(name, country)
    }

    const deleteSymbol = '~'
    const updated = new Channel({
      id: channelId,
      name: data.get('name') !== deleteSymbol ? data.get('name') : '',
      alt_names:
        data.has('alt_names') && data.get('alt_names') !== deleteSymbol
          ? data.get('alt_names').split(';')
          : [],
      network: data.get('network') !== deleteSymbol ? data.get('network') : '',
      owners:
        data.has('owners') && data.get('owners') !== deleteSymbol
          ? data.get('owners').split(';')
          : [],
      country: data.get('country') !== deleteSymbol ? data.get('country') : '',
      subdivision: data.get('subdivision') !== deleteSymbol ? data.get('subdivision') : '',
      city: data.get('city') !== deleteSymbol ? data.get('city') : '',
      broadcast_area:
        data.has('broadcast_area') && data.get('broadcast_area') !== deleteSymbol
          ? data.get('broadcast_area').split(';')
          : [],
      languages:
        data.has('languages') && data.get('languages') !== deleteSymbol
          ? data.get('languages').split(';')
          : [],
      categories:
        data.has('categories') && data.get('categories') !== deleteSymbol
          ? data.get('categories').split(';')
          : [],
      is_nsfw: data.has('is_nsfw') ? data.get('is_nsfw') === 'TRUE' : false,
      launched: data.get('launched') !== deleteSymbol ? data.get('launched') : '',
      closed: data.get('closed') !== deleteSymbol ? data.get('closed') : '',
      replaced_by: data.get('replaced_by') !== deleteSymbol ? data.get('replaced_by') : '',
      website: data.get('website') !== deleteSymbol ? data.get('website') : '',
      logo: data.get('logo') !== deleteSymbol ? data.get('logo') : ''
    })

    found.merge(updated)

    processedIssues.push(issue)
  })
}

async function addChannels({ loader, idCreator }: { loader: IssueLoader; idCreator: IDCreator }) {
  const issues = await loader.load({ labels: ['channels:add,approved'] })
  issues.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('name') || data.missing('country')) return

    const channelId = idCreator.create(data.get('name'), data.get('country'))

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
