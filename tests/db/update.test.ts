import { execSync } from 'child_process'
import * as fs from 'fs-extra'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/data', 'tests/__data__/output/data')
})

it('can update db with data from issues', () => {
  const stdout = execSync('DATA_DIR=tests/__data__/output/data npm run db:update --silent', {
    encoding: 'utf8'
  })

  expect(content('output/data/blocklist.csv')).toEqual(content('expected/data/blocklist.csv'))
  expect(content('output/data/channels.csv')).toEqual(content('expected/data/channels.csv'))
  expect(stdout).toEqual(
    'OUTPUT=closes #5871, closes #5901, closes #5701, closes #5900, closes #5899, closes #5898, closes #5897, closes #5891'
  )
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
