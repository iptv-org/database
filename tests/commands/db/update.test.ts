import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import os from 'os'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/db/update/data', 'tests/__data__/output/data')
})

describe('db:update', () => {
  let ENV_VAR = 'DATA_DIR=tests/__data__/output/data'
  if (os.platform() === 'win32') {
    ENV_VAR = 'SET "DATA_DIR=tests/__data__/output/data" &&'
  }

  it('can update db with data from issues', () => {
    const cmd = `${ENV_VAR} npm run db:update --silent`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('output/data/blocklist.csv')).toEqual(
      content('expected/db/update/data/blocklist.csv')
    )
    expect(content('output/data/channels.csv')).toEqual(
      content('expected/db/update/data/channels.csv')
    )
    expect(content('output/data/feeds.csv')).toEqual(content('expected/db/update/data/feeds.csv'))
    expect(content('output/data/logos.csv')).toEqual(content('expected/db/update/data/logos.csv'))
    expect(stdout).toEqual(
      'OUTPUT=closes #6871, closes #5871, closes #7901, closes #17612, closes #5901, closes #5902, closes #5903, closes #5701, closes #8900, closes #9900, closes #5900, closes #5899, closes #5898, closes #5897, closes #5891, closes #9871, closes #9902, closes #9903, closes #9901'
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
