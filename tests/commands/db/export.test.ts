import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import os from 'os'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('db:export', () => {
  let ENV_VAR = 'DATA_DIR=tests/__data__/input/db/export/data API_DIR=tests/__data__/output/api'
  if (os.platform() === 'win32') {
    ENV_VAR =
      'SET "DATA_DIR=tests/__data__/input/db/export/data" && SET "API_DIR=tests/__data__/output/api" &&'
  }

  it('can export data as json', () => {
    const cmd = `${ENV_VAR} npm run db:export`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('output/api/blocklist.json')).toEqual(
      content('expected/db/export/api/blocklist.json')
    )
    expect(content('output/api/channels.json')).toEqual(
      content('expected/db/export/api/channels.json')
    )
    expect(content('output/api/timezones.json')).toEqual(
      content('expected/db/export/api/timezones.json')
    )
    expect(content('output/api/feeds.json')).toEqual(content('expected/db/export/api/feeds.json'))
    expect(content('output/api/logos.json')).toEqual(content('expected/db/export/api/logos.json'))
  })
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
