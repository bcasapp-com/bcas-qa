import { cookieBannerLabels } from '../../data/third-party-labels'

import type { Locator, Page } from '@playwright/test'

// iubenda consent banner. It shows up on its own a moment after the page loads, over the app
export class CookieBanner {
  constructor(private readonly page: Page) {}

  get root(): Locator {
    return this.page.locator('#iubenda-cs-banner')
  }

  get rejectButton(): Locator {
    return this.root.getByRole('button', { name: cookieBannerLabels.reject, exact: true })
  }

  // Playwright rejects the cookies whenever the banner is on screen before an action, so no test
  // has to guess when it appears
  async rejectWhenShown(): Promise<void> {
    await this.page.addLocatorHandler(this.rejectButton, async () => {
      await this.rejectButton.click()
    })
  }
}
