import dayjs from 'dayjs'

type InputValue = string | number | boolean | undefined

type Rule = {
  validator: (value: InputValue) => boolean
  message: (label: string) => string
}

export type RuleId =
  | 'required'
  | 'noSpacedHyphen'
  | 'noDoubleSpace'
  | 'noCommas'
  | 'noDoubleQuotes'
  | 'onlyLatinLetters'
  | 'validDateFormat'
  | 'dateBeforeToday'
  | 'validDate'
  | 'validUrl'
  | 'noSpaces'
  | 'validNumber'
  | 'validWikidataId'
  | 'validLocode'

const _rules: Record<RuleId, Rule> = {
  required: {
    validator: value => value !== undefined && value !== null && String(value).trim() !== '',
    message: label => `The request is missing the "${label}"`
  },
  noSpacedHyphen: {
    validator: value => !/\s-\s/.test(String(value)),
    message: label => `"${label}" cannot contain a hyphen surrounded by spaces \` - \``
  },
  noSpaces: {
    validator: value => !/\s/.test(String(value)),
    message: label => `"${label}" cannot contain spaces`
  },
  noDoubleSpace: {
    validator: value => !/ {2}/.test(String(value)),
    message: label => `"${label}" cannot contain consecutive multiple spaces`
  },
  noCommas: {
    validator: value => !/,/.test(String(value)),
    message: label => `"${label}" cannot contain a comma`
  },
  noDoubleQuotes: {
    validator: value => !/"/.test(String(value)),
    message: label => `"${label}" cannot contain a double quotes`
  },
  onlyLatinLetters: {
    validator: value => /^[a-z0-9-!:&.+'/»#%°$@?|¡–\s_—]+$/i.test(String(value)),
    message: label =>
      `"${label}" can only contain Latin letters, numbers, spaces, and symbols like: \`!\`, \`@\`, \`#\`, \`$\`, \`%\`, \`&\`, \`.\`, \`_\``
  },
  validDateFormat: {
    validator: value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)),
    message: label => `"${label}" must be in the \`YYYY-MM-DD\` format`
  },
  validDate: {
    validator: value => {
      return dayjs(String(value), 'YYYY-MM-DD', true).isValid()
    },
    message: label => `"${label}" must be a valid date`
  },
  dateBeforeToday: {
    validator: value => {
      const today = dayjs().endOf('day')
      return dayjs(String(value), 'YYYY-MM-DD').isBefore(today)
    },
    message: label => `"${label}" must be a date before today`
  },
  validUrl: {
    validator: value => {
      try {
        const url = new URL(String(value))
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    },
    message: label => `"${label}" must be a valid URL`
  },
  validNumber: {
    validator: value => {
      const trimmed = String(value).trim()
      if (trimmed === '') return false
      return !isNaN(Number(trimmed))
    },
    message: label => `"${label}" must be a valid number`
  },
  validWikidataId: {
    validator: value => /^Q\d+$/.test(String(value)),
    message: label => `"${label}" must be a valid Wikidata ID`
  },
  validLocode: {
    validator: value =>
      /(A[D-GILMOQ-UWXZ]|B[ABIE-HDJLM-OQR-TWYZ]|C[ACDF-IK-ORU-Z]|D[EJKMOZ]|E[CEGHRST]|F[I-KMOR]|JE|G[ABD-IL-UWY]|H[KMNRTU]|I[DELMNOQRST]|J[MOP]|K[EGHIMNPRWY]|K[YZ]|L[ABCIKR-VY]|M[AC-HKL-Z]|N[ACE-ILO-PRUZ]|OM|[P-Z][A-Z]+)[A-Z0-9]{3}/.test(
        String(value)
      ),
    message: label => `"${label}" must be a valid UN/LOCODE`
  }
}

export function validate(label: string, value: InputValue, rules: RuleId[]) {
  if (value === undefined) return []

  const errors: string[] = []

  for (const id of rules) {
    const rule = _rules[id]
    if (!rule) continue

    if (!rule.validator(value)) {
      const error = rule.message(label)
      errors.push(error)

      break
    }
  }

  return errors
}
