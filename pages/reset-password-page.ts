import { BasePage } from './base-page'

import type { Locator } from '@playwright/test'

export class ResetPasswordPage extends BasePage {
  get emailInput(): Locator {
    return this.page.getByTestId('recovery-email-input')
  }

  get submitButton(): Locator {
    return this.page.getByTestId('recovery-submit-button')
  }

  get confirmationMessage(): Locator {
    return this.page.getByTestId('recovery-success')
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }
}
