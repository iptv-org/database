const { csv, file } = require('../core')
const channelScheme = require('../db/schemes/channels')
const { Octokit } = require('@octokit/core')
const { paginateRest } = require('@octokit/plugin-paginate-rest')
const CustomOctokit = Octokit.plugin(paginateRest)
const _ = require('lodash')

const octokit = new CustomOctokit({
  auth: process.env.GITHUB_TOKEN
})

const DATA_DIR = process.env.DATA_DIR || './data'
const OWNER = 'iptv-org'
const REPO = 'database'

let channels = []
let processedIssues = []

async function main() {
  try {
    const filepath = `${DATA_DIR}/channels.csv`
    channels = await csv.fromFile(filepath)

    await editChannels()
    await addChannels()

    console.log(channels[463])

    channels = _.orderBy(channels, [channels => channels.id.toLowerCase()], ['asc'])
    await csv.save(filepath, channels)

    const output = processedIssues.map(issue => `closes #${issue.number}`).join(', ')
    console.log(`OUTPUT=${output}`)
  } catch (err) {
    console.log(err.message)
  }
}

main()

async function editChannels() {
  const issues = await fetchIssues('channels:edit,approved')
  issues.map(parseIssue).forEach(({ issue, channel }) => {
    if (!channel) {
      updateIssue(issue, { labels: ['channels:edit', 'rejected:invalid'] })
      return
    }

    const index = _.findIndex(channels, { id: channel.id })
    if (!index) {
      updateIssue(issue, { labels: ['channels:edit', 'rejected:invalid'] })
      return
    }

    const found = channels[index]

    for (let prop in channel) {
      if (channel[prop] !== undefined) {
        found[prop] = channel[prop]
      }
    }

    channels.splice(index, 1, found)

    processedIssues.push(issue)
  })
}

async function addChannels() {
  const issues = await fetchIssues('channels:add,approved')
  issues.map(parseIssue).forEach(({ issue, channel }) => {
    if (!channel) {
      updateIssue(issue, { labels: ['channels:add', 'rejected:invalid'] })
      return
    }

    const found = channels.find(c => c.id === channel.id)
    if (found) {
      updateIssue(issue, { labels: ['channels:add', 'rejected:duplicate'] })
      return
    }

    channels.push(channel)
    processedIssues.push(issue)
  })
}

async function fetchIssues(labels) {
  const issues = await octokit.paginate('GET /repos/{owner}/{repo}/issues', {
    owner: OWNER,
    repo: REPO,
    per_page: 100,
    labels,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  return issues
}

async function updateIssue(issue, { labels }) {
  await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
    owner: OWNER,
    repo: REPO,
    issue_number: issue.number,
    labels,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
}

function parseIssue(issue) {
  const buffer = {}
  const channel = {}
  const fields = {
    'Channel ID (required)': 'id',
    'Channel Name': 'name',
    'Alternative Names': 'alt_names',
    'Alternative Names (optional)': 'alt_names',
    Network: 'network',
    'Network (optional)': 'network',
    Owners: 'owners',
    'Owners (optional)': 'owners',
    Country: 'country',
    Subdivision: 'subdivision',
    'Subdivision (optional)': 'subdivision',
    City: 'city',
    'City (optional)': 'city',
    'Broadcast Area': 'broadcast_area',
    Languages: 'languages',
    Categories: 'categories',
    'Categories (optional)': 'categories',
    NSFW: 'is_nsfw',
    Launched: 'launched',
    'Launched (optional)': 'launched',
    Closed: 'closed',
    'Closed (optional)': 'closed',
    'Replaced By': 'replaced_by',
    'Replaced By (optional)': 'replaced_by',
    Website: 'website',
    'Website (optional)': 'website',
    Logo: 'logo'
  }

  const matches = issue.body.match(/### ([^\r\n]+)[^\w\d]+([^\r\n]+)/g)

  if (!matches) return { issue, channel: null }

  matches.forEach(item => {
    const [, fieldLabel, value] = item.match(/### ([^\r\n]+)[^\w\d]+([^\r\n]+)/)
    const field = fields[fieldLabel]

    if (!field) return

    buffer[field] = value === '_No response_' ? undefined : value.trim()
  })

  for (let field of Object.keys(channelScheme)) {
    channel[field] = buffer[field]
  }

  if (!channel.id) {
    channel.id = generateChannelId(channel.name, channel.country)
  }

  return { issue, channel }
}

function generateChannelId(name, country) {
  if (name && country) {
    const slug = name
      .replace(/\+/gi, 'Plus')
      .replace(/^@/gi, 'At')
      .replace(/[^a-z\d]+/gi, '')
    country = country.toLowerCase()

    return `${slug}.${country}`
  }

  return null
}
