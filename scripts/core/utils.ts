import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'
import { stringQuoteOnlyIfNecessary } from '@json2csv/formatters'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { ImageProbeResult, CSVRow } from '../types/utils'
import { Collection, Dictionary } from '@freearhey/core'
import { TESTING, OWNER, REPO } from '../constants'
import { ValidatorError } from '../types/validator'
import { Parser } from '@json2csv/plainjs'
import { Octokit } from '@octokit/core'
import { Issue } from '../models/issue'
import probe from 'probe-image-size'
import { DataSet } from './dataSet'
import csv2json from 'csvtojson'
import path from 'node:path'
import chalk from 'chalk'

export function createStreamId(channelId?: string, feedId?: string): string | undefined {
  if (!channelId || !feedId) return undefined

  return `${channelId}@${feedId}`
}

export function createChannelId(
  name: string | undefined,
  country: string | undefined
): string | undefined {
  if (!name || !country) return undefined

  const slug = normalize(name)
  const code = country.toLowerCase()

  return `${slug}.${code}`
}

export function createFeedId(name: string): string {
  return normalize(name)
}

function normalize(string: string): string {
  return string
    .replace(/^@/gi, 'At')
    .replace(/^&/i, 'And')
    .replace(/\+/gi, 'Plus')
    .replace(/\s-(\d)/gi, ' Minus$1')
    .replace(/^-(\d)/gi, 'Minus$1')
    .replace(/[^a-z\d]+/gi, '')
}

export function getFileExtension(url: string): string {
  const filename = path.basename(url)
  const extension = path.extname(filename)

  return extension.replace(/^\./, '').toLowerCase()
}

export function convertToCSV(items: Record<string, string | string[] | boolean>[]): string {
  function flattenArray(item: { [key: string]: string[] | string | boolean }) {
    for (const prop in item) {
      const value = item[prop]
      item[prop] = Array.isArray(value) ? value.join(';') : value
    }

    return item
  }

  function formatBool(item: { [key: string]: string[] | string | boolean }) {
    for (const prop in item) {
      if (item[prop] === false) {
        item[prop] = 'FALSE'
      } else if (item[prop] === true) {
        item[prop] = 'TRUE'
      }
    }

    return item
  }

  const parser = new Parser({
    transforms: [flattenArray, formatBool],
    formatters: {
      string: stringQuoteOnlyIfNecessary()
    },
    eol: '\r\n'
  })

  return parser.parse(items)
}

export function parseIssueBody(body: string): DataSet {
  const fields = typeof body === 'string' ? body.split('###') : []

  const data = new Dictionary<string>()
  fields.forEach((field: string) => {
    const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
    let _label = parsed.shift()
    _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
    let _value = parsed.join('\r\n')
    _value = _value ? _value.trim() : ''

    if (!_label || !_value) return data

    const id: string | undefined = DataSet.getKeyForLabel(_label)
    const value: string =
      _value.toLowerCase() === '_no response_' || _value.toLowerCase() === 'none' ? '' : _value

    if (!id) return

    data.set(id, value)
  })

  return new DataSet(data)
}

export async function loadIssues(props?: {
  labels: string[] | string
}): Promise<Collection<Issue>> {
  type IssueItem = GetResponseDataTypeFromEndpointMethod<
    typeof octokit.rest.issues.listForRepo
  >[number]
  const CustomOctokit = Octokit.plugin(paginateRest, restEndpointMethods)
  const octokit = new CustomOctokit()

  let labels = ''
  if (props && props.labels) {
    labels = Array.isArray(props.labels) ? props.labels.join(',') : props.labels
  }

  let issues: IssueItem[] = []
  if (TESTING) {
    issues = (await import('../../tests/__data__/input/db/update/issues.js')).default as IssueItem[]
  } else {
    issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: OWNER,
      repo: REPO,
      per_page: 100,
      labels,
      status: 'open',
      sort: 'created',
      direction: 'asc',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }

  return new Collection<IssueItem>(issues).map((issue: IssueItem) => {
    const dataSet = parseIssueBody(issue.body || '')
    const labels = issue.labels.map(l => (typeof l === 'string' ? l : l.name || ''))
    return new Issue({ number: issue.number, labels, dataSet })
  })
}

export async function probeImage(url: string): Promise<ImageProbeResult> {
  const formatsByMimeType: { [key: string]: string } = {
    'image/svg+xml': 'SVG',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/avif': 'AVIF',
    'image/apng': 'APNG'
  }
  const formatsByExtension: { [key: string]: string } = {
    svg: 'SVG',
    png: 'PNG',
    jpeg: 'JPEG',
    jpg: 'JPEG',
    gif: 'GIF',
    webp: 'WebP',
    avif: 'AVIF',
    apng: 'APNG'
  }

  let width = 0
  let height = 0
  let format = ''

  if (TESTING) {
    return {
      width: 80,
      height: 80,
      format: 'JPEG'
    }
  } else {
    const imageInfo = await probe(url).catch(() => {})

    if (imageInfo) {
      width = Math.round(imageInfo.width)
      height = Math.round(imageInfo.height)
      format = formatsByMimeType[imageInfo.mime]
    }

    if (!format) {
      const extension = getFileExtension(url)
      format = formatsByExtension[extension]
    }

    return {
      width,
      height,
      format
    }
  }
}

export async function parseCSV(data: string): Promise<Collection<CSVRow>> {
  function listParser(value: string) {
    return value.split(';').filter(i => i)
  }

  function boolParser(value: string) {
    switch (value) {
      case 'TRUE':
        return true
      case 'FALSE':
        return false
      default:
        return value
    }
  }

  function numberParser(value: string) {
    return Number(value)
  }

  function stringParser(value: string) {
    return value === '' ? null : value
  }

  const opts = {
    checkColumn: true,
    trim: true,
    delimiter: ',',
    eol: '\r\n',
    colParser: {
      alt_names: listParser,
      network: stringParser,
      owners: listParser,
      subdivision: stringParser,
      broadcast_area: listParser,
      languages: listParser,
      categories: listParser,
      is_nsfw: boolParser,
      launched: stringParser,
      closed: stringParser,
      replaced_by: stringParser,
      website: stringParser,
      logo: stringParser,
      countries: listParser,
      timezones: listParser,
      is_main: boolParser,
      format: stringParser,
      feed: stringParser,
      tags: listParser,
      width: numberParser,
      height: numberParser,
      parent: stringParser,
      in_use: boolParser
    }
  }

  const parsed = await csv2json(opts).fromString(data)
  const rows = parsed.map((data, i) => {
    return { line: i + 2, data }
  })

  return new Collection(rows)
}

export function displayErrors(filepath: string, errors: Collection<ValidatorError>) {
  console.log(`\r\n${chalk.underline(filepath)}`)

  errors.forEach((error: ValidatorError) => {
    const position = error.line.toString().padEnd(6, ' ')
    console.log(` ${chalk.gray(position) + error.message}`)
  })
}

export function findDuplicatesBy<Type>(
  items: Collection<Type>,
  iterator: (item: Type) => string
): Collection<Type> {
  const duplicates = new Collection<Type>()
  const buffer = new Dictionary<boolean>()

  items.forEach((item: Type) => {
    const uid = iterator(item)
    if (buffer.has(uid)) {
      duplicates.add(item)
    }

    buffer.set(uid, true)
  })

  return duplicates
}
