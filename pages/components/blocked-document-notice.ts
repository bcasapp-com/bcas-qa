import type { Locator, Page } from '@playwright/test'

// Replaces the profile form when the student picks a document type that cannot get a loan
export class BlockedDocumentNotice {
  constructor(private readonly page: Page) {}

  get root(): Locator {
    return this.page.getByTestId('user-profile-invalid-document-state')
  }

  get title(): Locator {
    return this.page.getByTestId('user-profile-invalid-document-title')
  }

  get validDocuments(): Locator {
    return this.page
      .getByTestId('user-profile-invalid-document-valid-docs-list')
      .getByRole('listitem')
  }
}
