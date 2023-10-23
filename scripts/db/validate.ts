import { Collection, Storage, File, Dictionary, Logger } from '@freearhey/core'
import { DATA_DIR } from '../constants'
import { program } from 'commander'
import Joi from 'joi'
import { CSVParser, IDCreator } from '../core'
import chalk from 'chalk'

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

const logger = new Logger()
const buffer = new Dictionary()
const files = new Dictionary()
const schemes: { [key: string]: object } = require('../schemes')

async function main() {
  const dataStorage = new Storage(DATA_DIR)
  const _files = await dataStorage.list('*.csv')
  let globalErrors = new Collection()
  const parser = new CSVParser()

  for (const filepath of _files) {
    const file = new File(filepath)
    if (file.extension() !== 'csv') continue

    const csv = await dataStorage.load(file.basename())

    const rows = csv.split(/\r\n/)
    const headers = rows[0].split(',')
    for (const [i, line] of rows.entries()) {
      if (!line.trim()) continue
      if (line.indexOf('\n') > -1)
        return handleError(
          `Error: row ${i + 1} has the wrong line ending character, should be CRLF (${filepath})`
        )
      if (line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).length !== headers.length)
        return handleError(`Error: row ${i + 1} has the wrong number of columns (${filepath})`)
    }

    const data = await parser.parse(csv)
    const filename = file.name()

    let grouped
    switch (filename) {
      case 'blocklist':
        grouped = data.keyBy(item => item.channel)
        break
      case 'categories':
      case 'channels':
        grouped = data.keyBy(item => item.id)
        break
      default:
        grouped = data.keyBy(item => item.code)
        break
    }

    buffer.set(filename, grouped)
    files.set(filename, data)
  }

  const filesToCheck = program.args.length ? program.args : _files
  for (const filepath of filesToCheck) {
    const file = new File(filepath)
    const filename = file.name()
    if (!schemes[filename]) return handleError(`Error: "${filename}" scheme is missing`)

    const rows: Collection = files.get(filename)
    const rowsCopy = JSON.parse(JSON.stringify(rows.all()))

    let fileErrors = new Collection()
    switch (filename) {
      case 'channels':
        fileErrors = fileErrors.concat(findDuplicatesBy(rowsCopy, 'id'))
        for (const [i, row] of rowsCopy.entries()) {
          fileErrors = fileErrors.concat(validateChannelId(row, i))
          fileErrors = fileErrors.concat(validateChannelBroadcastArea(row, i))
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'id', 'subdivision', buffer.get('subdivisions'))
          )
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'id', 'categories', buffer.get('categories'))
          )
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'id', 'replaced_by', buffer.get('channels'))
          )
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'id', 'languages', buffer.get('languages'))
          )
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'id', 'country', buffer.get('countries'))
          )
        }
        break
      case 'blocklist':
        for (const [i, row] of rowsCopy.entries()) {
          fileErrors = fileErrors.concat(validateChannel(row.channel, i))
        }
        break
      case 'countries':
        fileErrors = fileErrors.concat(findDuplicatesBy(rowsCopy, 'code'))
        for (const [i, row] of rowsCopy.entries()) {
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'code', 'languages', buffer.get('languages'))
          )
        }
        break
      case 'subdivisions':
        fileErrors = fileErrors.concat(findDuplicatesBy(rowsCopy, 'code'))
        for (const [i, row] of rowsCopy.entries()) {
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'code', 'country', buffer.get('countries'))
          )
        }
        break
      case 'regions':
        fileErrors = fileErrors.concat(findDuplicatesBy(rowsCopy, 'code'))
        for (const [i, row] of rowsCopy.entries()) {
          fileErrors = fileErrors.concat(
            checkValue(i, row, 'code', 'countries', buffer.get('countries'))
          )
        }
        break
      case 'categories':
        fileErrors = fileErrors.concat(findDuplicatesBy(rowsCopy, 'id'))
        break
      case 'languages':
        fileErrors = fileErrors.concat(findDuplicatesBy(rowsCopy, 'code'))
        break
    }

    const schema = Joi.object(schemes[filename])
    rows.all().forEach((row: { [key: string]: string }, i: number) => {
      const { error } = schema.validate(row, { abortEarly: false })
      if (error) {
        error.details.forEach(detail => {
          fileErrors.push({ line: i + 2, row, message: detail.message })
        })
      }
    })

    if (fileErrors.count()) {
      logger.info(`\n${chalk.underline(filepath)}`)
      fileErrors.forEach(err => {
        const position = err.line.toString().padEnd(6, ' ')
        const id = err.row && err.row.id ? ` ${err.row.id}:` : ''
        logger.info(` ${chalk.gray(position)}${id} ${err.message}`)
      })
      globalErrors = globalErrors.concat(fileErrors)
    }
  }

  if (globalErrors.count()) return handleError(`${globalErrors.count()} error(s)`)
}

main()

function checkValue(
  i: number,
  row: { [key: string]: string[] | string | boolean },
  key: string,
  field: string,
  collection: Collection
) {
  const errors = new Collection()
  let values: string[] = []
  if (Array.isArray(row[field])) {
    values = row[field] as string[]
  } else if (typeof row[field] === 'string') {
    values = new Array(row[field]) as string[]
  }

  values.forEach((value: string) => {
    if (collection.missing(value)) {
      errors.push({
        line: i + 2,
        message: `"${row[key]}" has an invalid ${field} "${value}"`
      })
    }
  })

  return errors
}

function validateChannel(channelId: string, i: number) {
  const errors = new Collection()
  const channels = buffer.get('channels')

  if (channels.missing(channelId)) {
    errors.push({
      line: i + 2,
      message: `"${channelId}" is missing in the channels.csv`
    })
  }

  return errors
}

function findDuplicatesBy(rows: { [key: string]: string }[], key: string) {
  const errors = new Collection()
  const buffer = new Dictionary()

  rows.forEach((row, i) => {
    const normId = row[key].toLowerCase()
    if (buffer.has(normId)) {
      errors.push({
        line: i + 2,
        message: `entry with the ${key} "${row[key]}" already exists`
      })
    }

    buffer.set(normId, true)
  })

  return errors
}

function validateChannelId(row: { [key: string]: string }, i: number) {
  const errors = new Collection()

  const expectedId = new IDCreator().create(row.name, row.country)

  if (expectedId !== row.id) {
    errors.push({
      line: i + 2,
      message: `"${row.id}" must be derived from the channel name "${row.name}" and the country code "${row.country}"`
    })
  }

  return errors
}

function validateChannelBroadcastArea(row: { [key: string]: string[] }, i: number) {
  const errors = new Collection()
  const regions = buffer.get('regions')
  const countries = buffer.get('countries')
  const subdivisions = buffer.get('subdivisions')

  row.broadcast_area.forEach((areaCode: string) => {
    const [type, code] = areaCode.split('/')
    if (
      (type === 'r' && regions.missing(code)) ||
      (type === 'c' && countries.missing(code)) ||
      (type === 's' && subdivisions.missing(code))
    ) {
      errors.push({
        line: i + 2,
        message: `"${row.id}" has the wrong broadcast_area "${areaCode}"`
      })
    }
  })

  return errors
}

function handleError(message: string) {
  logger.error(chalk.red(message))
  process.exit(1)
}
