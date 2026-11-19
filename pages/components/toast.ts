import type { Locator, Page } from '@playwright/test'

export class Toast {
  constructor(private readonly page: Page) {}

  withMessage(message: string): Locator {
    return this.page.getByRole('status').filter({ hasText: message })
  }
}
