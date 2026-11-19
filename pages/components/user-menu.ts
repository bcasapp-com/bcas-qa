import { appLabels } from '../../data/app-labels'

import type { Locator, Page } from '@playwright/test'

interface UserMenuLocators {
  trigger?: Locator
  logoutItem?: Locator
}

export class UserMenu {
  private readonly trigger: Locator
  private readonly logoutItem: Locator

  constructor(
    private readonly page: Page,
    locators: UserMenuLocators = {}
  ) {
    // The agent dashboard and the student portal render the trigger without a test id
    this.trigger = locators.trigger ?? page.locator('span[aria-haspopup="menu"]')
    this.logoutItem =
      locators.logoutItem ?? this.menu.getByRole('menuitem', { name: appLabels.logout })
  }

  get menu(): Locator {
    return this.page.getByRole('menu')
  }

  get email(): Locator {
    return this.menu.getByTestId('user-menu-email')
  }

  async open(): Promise<void> {
    await this.trigger.click()
    await this.menu.waitFor({ state: 'visible' })
  }

  async logout(): Promise<void> {
    await this.open()
    await this.logoutItem.click()
  }
}
