import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

describe('db:validate', () => {
  it('shows an error if the number of columns in a row is incorrect', () => {
    try {
      execSync('DATA_DIR=tests/__data__/input/validate/wrong_num_cols npm run db:validate', {
        encoding: 'utf8'
      })
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        'Error: row 2 has the wrong number of columns (categories.csv)'
      )
    }
  })

  it('shows an error if one of the lines ends with an invalid character', () => {
    try {
      execSync('DATA_DIR=tests/__data__/input/validate/invalid_line_ending npm run db:validate', {
        encoding: 'utf8'
      })
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(
        'Error: row 1 has the wrong line ending character, should be CRLF (categories.csv)'
      )
    }
  })

  it('shows an error if there are duplicates in the file', () => {
    try {
      execSync('DATA_DIR=tests/__data__/input/validate/duplicate npm run db:validate', {
        encoding: 'utf8'
      })
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('entry with the id "aaa" already exists')
      expect((error as ExecError).stdout).toContain(
        'entry with the channel "002RadioTV.do" and ref "eee" already exists'
      )
      expect((error as ExecError).stdout).toContain(
        'entry with the channel "002RadioTV.do" and id "SD" already exists'
      )
    }
  })

  it('shows an error if the data contains an error', () => {
    try {
      execSync('DATA_DIR=tests/__data__/input/validate/invalid_value npm run db:validate', {
        encoding: 'utf8'
      })
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain('"aaa.us" is missing in the channels.csv')
      expect((error as ExecError).stdout).toContain(
        '"002RadioTV.do" has an invalid replaced_by "002RadioTV.do@4K"'
      )
      expect((error as ExecError).stdout).toContain(
        '"10Channel.do" channel does not have a main feed'
      )
      expect((error as ExecError).stdout).toContain('"24B.do" channel does not have a main feed')
      expect((error as ExecError).stdout).toContain(
        '002RadioTV.do: "website" must be a valid uri with a scheme matching the http|https pattern'
      )
      expect((error as ExecError).stdout).toContain(
        'entry with the channel "002RadioTV.do" and is_main "true" already exists'
      )
      expect((error as ExecError).stdout).toContain('"0TV.dk" is missing in the channels.csv')
      expect((error as ExecError).stdout).toContain(
        '"0TV.dk@SD" has the wrong timezone "Europe/Copenhagen"'
      )
      expect((error as ExecError).stdout).toContain(
        'SD: "video_format" with value "576I" fails to match the required pattern'
      )
      expect((error as ExecError).stdout).toContain('9 error(s)')
    }
  })

  it('does not show an error if all data are correct', () => {
    try {
      execSync('DATA_DIR=tests/__data__/input/validate/valid_data npm run db:validate', {
        encoding: 'utf8'
      })
    } catch (error) {
      console.log((error as ExecError).stdout)
      process.exit(1)
    }
  })
})
