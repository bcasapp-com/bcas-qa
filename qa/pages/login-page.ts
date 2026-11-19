import { BasePage } from './base-page'
import { routes } from '../data/routes'
import { apiEndpoints, waitForApiResponse } from '../utils/api-responses'

import type { Credentials } from '../data/test-users'
import type { Locator } from '@playwright/test'

export class LoginPage extends BasePage {
  get emailInput(): Locator {
    return this.page.getByTestId('login-email-input')
  }

  get invalidEmailInput(): Locator {
    return this.emailInput.and(this.page.locator(':invalid'))
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('login-password-input')
  }

  get submitButton(): Locator {
    return this.page.getByTestId('login-submit-button')
  }

  get invalidCredentialsError(): Locator {
    return this.page.getByTestId('login-error')
  }

  get forgotPasswordLink(): Locator {
    return this.page.getByTestId('reset-password-link')
  }

  async goto(): Promise<void> {
    await this.page.goto(routes.login)
  }

  async open(): Promise<void> {
    await this.goto()
    await this.waitForLoaded()
  }

  async waitForLoaded(): Promise<void> {
    await this.waitUntilVisible(this.emailInput)
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  // The landing page depends on the role, so the login is done once the session is created
  async loginAs({ email, password }: Credentials): Promise<void> {
    const sessionResponse = waitForApiResponse(this.page, apiEndpoints.session, {
      isOkRequired: true
    })

    await this.login(email, password)
    await sessionResponse
  }
}
