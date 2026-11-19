import { BasePage } from './base-page'
import { stripeCheckoutLabels as LABELS } from '../data/third-party-labels'
import { THIRD_PARTY_PAGE_TIMEOUT } from '../utils/timeouts'

import type { StripeTestCard } from '../data/stripe-test-cards'
import type { FrameLocator, Locator } from '@playwright/test'

export class StripeCheckoutPage extends BasePage {
  // The iframe title is translated, so the card form frame is identified by attributes
  // Stripe does not localize: its name prefix and the passkey permission only it requests
  private get paymentFrame(): FrameLocator {
    return this.page.frameLocator(
      'iframe[name^="__privateStripeFrame"][allow*="publickey-credentials-get"]'
    )
  }

  get cardNumberInput(): Locator {
    return this.paymentFrame.getByRole('textbox', { name: LABELS.cardNumber })
  }

  get cardExpiryInput(): Locator {
    return this.paymentFrame.getByRole('textbox', { name: LABELS.cardExpiry })
  }

  get cardCvcInput(): Locator {
    return this.paymentFrame.getByRole('textbox', { name: LABELS.cardCvc })
  }

  get cardholderNameInput(): Locator {
    return this.paymentFrame.getByRole('textbox', { name: LABELS.cardholderName })
  }

  get payButton(): Locator {
    return this.paymentFrame.getByRole('button', { name: LABELS.payButton })
  }

  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL((url) => url.hostname === 'checkout.stripe.com', {
      timeout: THIRD_PARTY_PAGE_TIMEOUT
    })
    await this.cardNumberInput.waitFor({ state: 'visible', timeout: THIRD_PARTY_PAGE_TIMEOUT })
  }

  async payWithCard(card: StripeTestCard, cardholderName: string): Promise<void> {
    await this.cardNumberInput.fill(card.number)
    await this.cardExpiryInput.fill(card.expiry)
    await this.cardCvcInput.fill(card.cvc)
    await this.cardholderNameInput.fill(cardholderName)
    await this.payButton.click()
  }
}
