import { getApiUrl } from '../utils/env'

import type { APIResponse } from '@playwright/test'

export function apiUrl(path: string): string {
  return new URL(path, getApiUrl()).href
}

export async function parseApiResponse<T>(response: APIResponse, action: string): Promise<T> {
  const body = await response.json().catch(() => null)

  if (!response.ok() || typeof body?.statusCode === 'number') {
    throw new Error(`${action} failed with ${response.status()}: ${JSON.stringify(body)}`)
  }

  return body
}
