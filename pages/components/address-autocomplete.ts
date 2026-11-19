import type { Locator, Page } from '@playwright/test'

// Google Places search: the typed text only counts once a suggestion is picked, which turns the
// search into a read-only confirmed address. Every element shares the same test id base
export class AddressAutocomplete {
  constructor(
    private readonly page: Page,
    private readonly testIdBase: string
  ) {}

  get input(): Locator {
    return this.page.getByTestId(`${this.testIdBase}-input`)
  }

  get confirmed(): Locator {
    return this.page.getByTestId(`${this.testIdBase}-confirmed`)
  }

  get confirmedValue(): Locator {
    return this.page.getByTestId(`${this.testIdBase}-value`)
  }

  get changeButton(): Locator {
    return this.page.getByTestId(`${this.testIdBase}-change-button`)
  }

  option(index: number): Locator {
    return this.page.getByTestId(`${this.testIdBase}-option-${index}`)
  }

  // An address already saved is shown read-only, so the search has to be reopened first
  async search(text: string): Promise<void> {
    await this.input.or(this.confirmed).waitFor()
    if (await this.confirmed.isVisible()) {
      await this.changeButton.click()
    }

    await this.input.fill(text)
  }

  async searchAndConfirm(text: string): Promise<void> {
    await this.search(text)
    await this.option(0).click()
    await this.confirmed.waitFor()
  }
}
