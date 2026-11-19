export function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing environment variable "${name}". Copy qa/.env.example to qa/.env and fill it in.`
    )
  }

  return value
}

const DEV_BASE_URL = 'https://dev.bcasapp.com/'
const DEV_API_URL = 'https://dev-s.bcasapp.com/'

export function getBaseUrl(): string {
  return process.env.E2E_BASE_URL || DEV_BASE_URL
}

// The API default only pairs with the dev web app; pointing the web app elsewhere without the
// matching API would create test data in one backend and look for it in another
export function getApiUrl(): string {
  const isDevWebApp = new URL(getBaseUrl()).origin === new URL(DEV_BASE_URL).origin

  return isDevWebApp ? process.env.E2E_API_URL || DEV_API_URL : requireEnv('E2E_API_URL')
}

export function optionalIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name]

  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed)) {
    throw new Error(`Environment variable "${name}" must be an integer, got "${value}".`)
  }

  return parsed
}
