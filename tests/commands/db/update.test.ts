import { beforeEach, describe, it, expect } from 'vitest'
import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/db/update/data', 'tests/__data__/output/data')
})

describe('db:update', () => {
  const ENV_VAR =
    'cross-env DATA_DIR=tests/__data__/output/data LOGS_DIR=tests/__data__/output/logs'

  it('can update db with data from issues', () => {
    const cmd = `${ENV_VAR} npm run db:update`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const files = glob.sync('tests/__data__/expected/db/update/data/*.csv').map(filepath => {
      const fileUrl = pathToFileURL(filepath).toString()
      const pathToRemove = pathToFileURL('tests/__data__/expected/db/update/data/').toString()

      return fileUrl.replace(pathToRemove, '')
    })

    files.forEach(filepath => {
      expect(content(`tests/__data__/output/data/${filepath}`), filepath).toBe(
        content(`tests/__data__/expected/db/update/data/${filepath}`)
      )
    })

    expect(content('tests/__data__/output/logs/update.log')).toBe(
      content('tests/__data__/expected/db/update/update.log')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
