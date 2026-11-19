import { SLOW_PAGE_TIMEOUT } from '../utils/timeouts'
import { urlPath, waitForPathname } from '../utils/url'

import type { Locator, Page } from '@playwright/test'

// Every page object follows the same contract:
// - goto(...): navigates only, for the tests that expect a redirect
// - open(...): navigates and waits until the page is ready to be used
// - waitForLoaded(...): waits until the page is ready, after a navigation the app triggers
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async waitUntilVisible(locator: Locator, timeout = SLOW_PAGE_TIMEOUT): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout })
  }

  // The pathname must be exactly this one
  protected async waitForPath(path: string, timeout = SLOW_PAGE_TIMEOUT): Promise<void> {
    await waitForPathname(this.page, path, timeout)
  }

  // This path or any page under it, as the app may land on a sub-section of it
  protected async waitForPathOrBelow(path: string, timeout = SLOW_PAGE_TIMEOUT): Promise<void> {
    await this.page.waitForURL(urlPath(path), { timeout })
  }
}
