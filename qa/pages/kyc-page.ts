import { BasePage } from './base-page'
import { routes } from '../data/routes'

import type { Locator } from '@playwright/test'

// Identity check: the recommendations come first, then the Permisso verification frame
export class KycPage extends BasePage {
  get recommendationsSection(): Locator {
    return this.page.getByTestId('user-kyc-recommendations-section')
  }

  get continueButton(): Locator {
    return this.page.getByTestId('user-kyc-recommendations-continue-button')
  }

  // Permisso's frame has no test id or accessible name
  get verificationFrame(): Locator {
    return this.page.locator('#iframeBankflip')
  }

  async waitForLoaded(): Promise<void> {
    await this.waitUntilVisible(this.recommendationsSection)
  }

  async openVerification(loanId: string): Promise<void> {
    await this.continueButton.click()
    await this.waitForPath(routes.kyc(loanId))
  }
}
