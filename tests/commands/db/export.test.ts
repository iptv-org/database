import { beforeEach, describe, it, expect } from 'vitest'
import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('db:export', () => {
  const ENV_VAR =
    'cross-env DATA_DIR=tests/__data__/input/db/export/data API_DIR=tests/__data__/output/api'

  it('can export data as json', () => {
    const cmd = `${ENV_VAR} npm run db:export`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const files = glob.sync('tests/__data__/expected/db/export/api/*.json').map(filepath => {
      const fileUrl = pathToFileURL(filepath).toString()
      const pathToRemove = pathToFileURL('tests/__data__/expected/db/export/api/').toString()

      return fileUrl.replace(pathToRemove, '')
    })

    files.forEach(filepath => {
      expect(content(`tests/__data__/output/api/${filepath}`), filepath).toBe(
        content(`tests/__data__/expected/db/export/api/${filepath}`)
      )
    })
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
