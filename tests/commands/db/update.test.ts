import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/db/update/data', 'tests/__data__/output/data')
})

describe('db:update', () => {
  const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/output/data'

  it('can update db with data from issues', () => {
    const cmd = `${ENV_VAR} npm run db:update --silent`
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

    expect(stdout).toEqual(
      'OUTPUT=closes #9871, closes #9902, closes #9903, closes #9904, closes #9905, closes #9901, closes #6871, closes #7901, closes #17612, closes #9907, closes #8900, closes #9900, closes #5871, closes #5901, closes #5902, closes #5903, closes #5701, closes #9906, closes #5900, closes #5899, closes #5898, closes #9912, closes #9911, closes #9910, closes #5897, closes #5891'
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
