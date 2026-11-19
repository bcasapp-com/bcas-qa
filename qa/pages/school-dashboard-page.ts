import { BasePage } from './base-page'
import { UserMenu } from './components/user-menu'
import { routes } from '../data/routes'
import { sqaSchoolId } from '../data/test-users'

import type { Locator } from '@playwright/test'

export class SchoolDashboardPage extends BasePage {
  readonly userMenu = new UserMenu(this.page, {
    trigger: this.page.getByTestId('school-dashboard-dropdown-trigger-button'),
    logoutItem: this.page.getByTestId('school-dashboard-logout-button')
  })

  // The design system sidebar exposes no test id, only its data-sidebar attribute
  get sidebarContent(): Locator {
    return this.page.locator('[data-sidebar="content"]')
  }

  get currentSchoolName(): Locator {
    return this.page.getByTestId('school-dashboard-school-switcher-trigger-button')
  }

  get newLoanButton(): Locator {
    return this.page.getByTestId('school-loans-create-button')
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.schoolDashboard(sqaSchoolId))
  }

  async open(): Promise<void> {
    await this.goto()
    await this.waitForLoaded()
  }

  async waitForLoaded(): Promise<void> {
    await this.waitForPathOrBelow(routes.schoolDashboard(sqaSchoolId))
    await this.waitUntilVisible(this.sidebarContent)
  }

  async goToNewLoan(): Promise<void> {
    await this.newLoanButton.click()
  }
}
