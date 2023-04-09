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

async function main() {
  try {
    const filepath = `${DATA_DIR}/channels.csv`
    let channels = await csv.fromFile(filepath)
    const issues = await fetchIssues('channels:add,approved')
    const processedIssues = []
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

    channels = _.orderBy(channels, [channels => channels.id.toLowerCase()], ['asc'])
    await csv.save(filepath, channels)

    const output = processedIssues.map(issue => `closes #${issue.number}`).join(', ')
    console.log(`OUTPUT=${output}`)
  } catch (err) {
    console.log(err.message)
  }
}

main()

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
    'Channel Name': 'name',
    'Alternative Names (optional)': 'alt_names',
    'Network (optional)': 'network',
    'Owners (optional)': 'owners',
    Country: 'country',
    'Subdivision (optional)': 'subdivision',
    'City (optional)': 'city',
    'Broadcast Area': 'broadcast_area',
    Languages: 'languages',
    'Categories (optional)': 'categories',
    NSFW: 'is_nsfw',
    'Launched (optional)': 'launched',
    'Closed (optional)': 'closed',
    'Replaced By (optional)': 'replaced_by',
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

  channel.id = generateChannelId(channel.name, channel.country)

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
