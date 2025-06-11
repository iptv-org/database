import { execSync } from 'child_process'
import os from 'os'

type ExecError = {
  status: number
  stdout: string
}

describe('db:validate', () => {
  it('shows an error if the number of columns in a row is incorrect', () => {
    let ENV_VAR = 'DATA_DIR=tests/__data__/input/db/validate/wrong_num_cols'
    if (os.platform() === 'win32') {
      ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/db/validate/wrong_num_cols" &&'
    }
    const cmd = `${ENV_VAR} npm run db:validate`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, (error as ExecError).stdout)
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('row has the wrong number of columns')
    }
  })

  it('shows an error if one of the lines ends with an invalid character', () => {
    let ENV_VAR = 'DATA_DIR=tests/__data__/input/db/validate/invalid_line_ending'
    if (os.platform() === 'win32') {
      ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/db/validate/invalid_line_ending" &&'
    }
    const cmd = `${ENV_VAR} npm run db:validate`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, (error as ExecError).stdout)
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        'row has the wrong line ending character, should be CRLF'
      )
    }
  })

  it('shows an error if there are duplicates in the file', () => {
    let ENV_VAR = 'DATA_DIR=tests/__data__/input/db/validate/duplicate'
    if (os.platform() === 'win32') {
      ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/db/validate/duplicate" &&'
    }
    const cmd = `${ENV_VAR} npm run db:validate`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, (error as ExecError).stdout)
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('category with id "aaa" already exists')
      expect((error as ExecError).stdout).toContain(
        'blocklist record with channel "002RadioTV.do" and ref "https://en.wikipedia.org/wiki/Lemurs_of_Madagascar_(book)" already exists'
      )
      expect((error as ExecError).stdout).toContain(
        'feed with channel "002RadioTV.do" and id "SD" already exists'
      )
      expect((error as ExecError).stdout).toContain('3 error(s)')
    }
  })

  it('shows an error if the data contains an error', () => {
    let ENV_VAR = 'DATA_DIR=tests/__data__/input/db/validate/invalid_value'
    if (os.platform() === 'win32') {
      ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/db/validate/invalid_value" &&'
    }
    const cmd = `${ENV_VAR} npm run db:validate`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, (error as ExecError).stdout)
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('"aaa.us" is missing from the channels.csv')
      expect((error as ExecError).stdout).toContain(
        '"002RadioTV.do" has an invalid replaced_by "002RadioTV.do@4K"'
      )
      expect((error as ExecError).stdout).toContain('"24B.do" does not have a main feed')
      expect((error as ExecError).stdout).toContain(
        '002RadioTV.do: "website" must be a valid uri with a scheme matching the http|https pattern'
      )
      expect((error as ExecError).stdout).toContain(
        '"002RadioTV.do" has an more than one main feed'
      )
      expect((error as ExecError).stdout).toContain('"0TV.dk@SD" has the wrong channel "0TV.dk"')
      expect((error as ExecError).stdout).toContain(
        '"0TV.dk@SD" has the wrong broadcast_area "c/BE"'
      )
      expect((error as ExecError).stdout).toContain(
        '"0TV.dk@SD" has the wrong timezones "Europe/Copenhagen"'
      )
      expect((error as ExecError).stdout).toContain(
        '0TV.dk@SD: "video_format" with value "576I" fails to match the required pattern'
      )
      expect((error as ExecError).stdout).toContain('10 error(s)')
    }
  })

  it('does not show an error if all data are correct', () => {
    let ENV_VAR = 'DATA_DIR=tests/__data__/input/db/validate/valid_data'
    if (os.platform() === 'win32') {
      ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/db/validate/valid_data" &&'
    }
    const cmd = `${ENV_VAR} npm run db:validate`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, (error as ExecError).stdout)
      process.exit(1)
    }
  })
})
