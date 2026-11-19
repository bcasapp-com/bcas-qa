import { BasePage } from './base-page'

import type { Locator } from '@playwright/test'

export class SignupPage extends BasePage {
  get form(): Locator {
    return this.page.getByTestId('user-signup-form')
  }

  get emailInput(): Locator {
    return this.page.getByTestId('user-signup-email-input')
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('user-signup-password-input')
  }

  get acceptTermsCheckbox(): Locator {
    return this.page.getByTestId('user-signup-accept-terms-checkbox')
  }

  get submitButton(): Locator {
    return this.page.getByTestId('user-signup-submit-button')
  }

  // The student link carries a one-time token, so it is opened as is instead of through a route
  async open(studentLink: string): Promise<void> {
    await this.page.goto(studentLink)
    await this.waitForLoaded()
  }

  async waitForLoaded(): Promise<void> {
    await this.waitUntilVisible(this.form)
  }

  async signup(password: string): Promise<void> {
    await this.passwordInput.fill(password)
    await this.acceptTermsCheckbox.check()
    await this.submitButton.click()
  }
}
