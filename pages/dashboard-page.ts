import { BasePage } from './base-page'
import { UserMenu } from './components/user-menu'
import { routes } from '../data/routes'

import type { Locator } from '@playwright/test'

export class DashboardPage extends BasePage {
  readonly userMenu = new UserMenu(this.page, {
    logoutItem: this.page.getByTestId('logout-button')
  })

  // The design system sidebar exposes no test id, only its data-sidebar attribute
  get sidebar(): Locator {
    return this.page.locator('[data-sidebar="sidebar"]')
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.dashboard)
  }

  async waitForLoaded(): Promise<void> {
    await this.waitForPathOrBelow(routes.dashboard)
    await this.waitUntilVisible(this.sidebar)
  }
}
