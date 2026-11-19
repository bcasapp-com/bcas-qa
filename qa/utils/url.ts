import { SLOW_PAGE_TIMEOUT } from './timeouts'

import type { Page } from '@playwright/test'

export function urlPath(path: string): RegExp {
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const segmentEnd = path.endsWith('/') ? '' : '(?:[/?#]|$)'

  return new RegExp(`^[a-z]+://[^/]+${escapedPath}${segmentEnd}`)
}

export async function waitForPathname(
  page: Page,
  path: string,
  timeout = SLOW_PAGE_TIMEOUT
): Promise<void> {
  await page.waitForURL((url) => url.pathname === path, { timeout })
}
