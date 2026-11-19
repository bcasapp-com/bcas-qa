import { knownAddresses } from '../data/addresses'

import type { BrowserContext, Route } from '@playwright/test'

const AUTOCOMPLETE_ROUTE = '**/api/places/autocomplete'
const DETAILS_ROUTE = '**/api/places/details'

interface AutocompleteRequestBody {
  input?: unknown
}

interface DetailsRequestBody {
  placeId?: unknown
}

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function answerAutocomplete(route: Route): Promise<void> {
  const body: AutocompleteRequestBody = route.request().postDataJSON() ?? {}
  const input = typeof body.input === 'string' ? body.input.trim().toLowerCase() : ''

  const suggestions = knownAddresses
    .filter((address) => address.searchText.toLowerCase().startsWith(input))
    .map((address) => address.suggestion)

  await fulfillJson(route, 200, { data: suggestions, error: null })
}

async function answerDetails(route: Route): Promise<void> {
  const body: DetailsRequestBody = route.request().postDataJSON() ?? {}
  const address = knownAddresses.find((candidate) => candidate.suggestion.placeId === body.placeId)

  if (!address) {
    await fulfillJson(route, 502, { data: null, error: 'PROVIDER_ERROR' })
    return
  }

  await fulfillJson(route, 200, { data: address.details, error: null })
}

// Every Google Places call is billed and rate limited per user, and its suggestions change over
// time, so the app's own Places routes answer from the known test addresses instead
export async function mockAddressSearch(context: BrowserContext): Promise<void> {
  await context.route(AUTOCOMPLETE_ROUTE, answerAutocomplete)
  await context.route(DETAILS_ROUTE, answerDetails)
}
