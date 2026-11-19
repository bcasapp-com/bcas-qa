import { TEST_LOCALE } from './app-labels'

export interface Nationality {
  // ISO 3166-1 alpha-2 code, the value the app stores
  code: string
  // Name the app shows in the TEST_LOCALE language
  name: string
}

export const SPAIN_CODE = 'ES'

// Official list of EU member states. The nationality rules of the identity documents are defined
// on it, and no country catalogue exposes it, so it is the only country list kept in qa
const EU_MEMBER_CODES: readonly string[] = [
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK'
]

export function isEuMember(code: string): boolean {
  return EU_MEMBER_CODES.includes(code)
}

const countryNames = new Intl.DisplayNames([TEST_LOCALE], { type: 'region' })

// For the forms that only show the name of a nationality the app fills in on its own
export function countryName(code: string): string {
  const name = countryNames.of(code)

  if (!name) {
    throw new Error(`No ${TEST_LOCALE} name for the country code "${code}"`)
  }

  return name
}
