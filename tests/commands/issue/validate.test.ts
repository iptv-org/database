import { beforeEach, describe, it, expect } from 'vitest'
import issues from '../../__data__/input/issues'
import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/data LOGS_DIR=tests/__data__/output/logs'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('issue:validate', () => {
  it('can handle channels:add request', () => {
    const body = issues.find(issue => issue.number === 31773)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,channels:add"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/channels_add.txt')
      )
    }
  })

  it('can handle channels:edit request', () => {
    const body = issues.find(issue => issue.number === 31760)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,channels:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/channels_edit.txt')
      )
    }
  })

  it('can handle channels:edit request without changes', () => {
    const body = issues.find(issue => issue.number === 31767)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,channels:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/channels_edit_no_changes.txt')
      )
    }
  })

  it('can handle channels:remove request', () => {
    const body = issues.find(issue => issue.number === 31771)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,channels:remove"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/channels_remove.txt')
      )
    }
  })

  it('can handle feeds:add request', () => {
    const body = issues.find(issue => issue.number === 31777)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,feeds:add"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/feeds_add.txt')
      )
    }
  })

  it('can handle invalid feeds:edit request', () => {
    const body = issues.find(issue => issue.number === 31626)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,feeds:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/feeds_edit.txt')
      )
    }
  })

  it('can handle valid feeds:add request', () => {
    const body = issues.find(issue => issue.number === 31726)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,feeds:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      expect(true).toBe(true)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      process.exit(1)
    }
  })

  it('can handle feeds:edit request without changes', () => {
    const body = issues.find(issue => issue.number === 31627)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,feeds:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/feeds_edit_no_changes.txt')
      )
    }
  })

  it('can handle feeds:remove request', () => {
    const body = issues.find(issue => issue.number === 31785)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,feeds:remove"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/feeds_remove.txt')
      )
    }
  })

  it('can handle logos:add request', () => {
    const body = issues.find(issue => issue.number === 31764)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,logos:add"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/logos_add.txt')
      )
    }
  })

  it('can handle logos:edit request', () => {
    const body = issues.find(issue => issue.number === 31786)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,logos:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/logos_edit.txt')
      )
    }
  })

  it('can handle logos:edit request with new feed id', () => {
    const body = issues.find(issue => issue.number === 31986)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,logos:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/logos_edit_new_feed_id.txt')
      )
    }
  })

  it('can handle logos:edit request without changes', () => {
    const body = issues.find(issue => issue.number === 31886)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,logos:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/logos_edit_no_changes.txt')
      )
    }
  })

  it('can handle logos:remove request', () => {
    const body = issues.find(issue => issue.number === 31787)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,logos:remove"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/logos_remove.txt')
      )
    }
  })

  it('can handle cities:add request', () => {
    const body = issues.find(issue => issue.number === 31788)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,cities:add"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/cities_add.txt')
      )
    }
  })

  it('can handle cities:edit request', () => {
    const body = issues.find(issue => issue.number === 31789)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,cities:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/cities_edit.txt')
      )
    }
  })

  it('can handle cities:edit request without changes', () => {
    const body = issues.find(issue => issue.number === 31889)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,cities:edit"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/cities_edit_no_changes.txt')
      )
    }
  })

  it('can handle cities:remove request', () => {
    const body = issues.find(issue => issue.number === 31790)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,cities:remove"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/cities_remove.txt')
      )
    }
  })

  it('can handle blocklist:add request', () => {
    const body = issues.find(issue => issue.number === 31791)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,blocklist:add"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/blocklist_add.txt')
      )
    }
  })

  it('can handle blocklist:remove request', () => {
    const body = issues.find(issue => issue.number === 31792)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,blocklist:remove"`

    if (process.env.DEBUG === 'true') console.log(cmd)
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(error)
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue/validate/logs/blocklist_remove.txt')
      )
    }
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
