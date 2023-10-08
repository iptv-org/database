import { execSync } from 'child_process'
import * as fs from 'fs-extra'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

it('can export data as json', () => {
  execSync(
    'DATA_DIR=tests/__data__/input/data API_DIR=tests/__data__/output/api npm run db:export',
    {
      encoding: 'utf8'
    }
  )

  expect(content('output/api/blocklist.json')).toEqual(content('expected/api/blocklist.json'))
  expect(content('output/api/channels.json')).toEqual(content('expected/api/channels.json'))
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
