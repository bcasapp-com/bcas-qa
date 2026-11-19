import { expect } from '@playwright/test'

import { BasePage } from './base-page'
import { pandadocLabels } from '../data/third-party-labels'
import { THIRD_PARTY_PAGE_TIMEOUT } from '../utils/timeouts'

import type { FrameLocator, Locator } from '@playwright/test'

const FINISH_CLICK_TIMEOUT = 10_000

// PandaDoc signing page, embedded in the app. Its own test ids use data-testid, not the
// data-test-id attribute the app uses
export class ContractSigningPage extends BasePage {
  private get document(): FrameLocator {
    return this.page.frameLocator('iframe[src*="pandadoc.com"]')
  }

  private pandadocTestId(testId: string): Locator {
    return this.document.locator(`[data-testid="${testId}"]`)
  }

  get actionButton(): Locator {
    return this.pandadocTestId('info-bar-action-button')
  }

  get signatureField(): Locator {
    return this.pandadocTestId('signature-field').first()
  }

  get signatureDialog(): Locator {
    return this.pandadocTestId('signature-stamp-dialog')
  }

  get acceptAndSignButton(): Locator {
    return this.signatureDialog.getByRole('button', { name: pandadocLabels.acceptAndSign })
  }

  get finishButton(): Locator {
    return this.actionButton.filter({ hasText: pandadocLabels.finish })
  }

  async waitForLoaded(): Promise<void> {
    await this.actionButton.waitFor({ state: 'visible', timeout: THIRD_PARTY_PAGE_TIMEOUT })
  }

  // The action button first scrolls to the signature field, then finishes the document. PandaDoc
  // relabels it a moment after the signature is applied, and a click before that only moves
  // between fields
  async sign(): Promise<void> {
    await this.actionButton.click()
    await this.signatureField.click()
    await this.acceptAndSignButton.click()
    await this.signatureDialog.waitFor({ state: 'hidden' })
    await this.finish()
  }

  // PandaDoc ignores the finish click while it is still saving the signature, and exposes no
  // signal for that save, so the click is repeated while the button stays on screen
  private async finish(): Promise<void> {
    await expect(async () => {
      if (await this.finishButton.isVisible()) {
        await this.finishButton.click()
      }
      await expect(this.finishButton).toBeHidden({ timeout: FINISH_CLICK_TIMEOUT })
    }).toPass({ timeout: THIRD_PARTY_PAGE_TIMEOUT })
  }
}
