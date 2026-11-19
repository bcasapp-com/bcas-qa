import { expect } from '@playwright/test'

import { BasePage } from './base-page'
import { appLabels } from '../data/app-labels'
import { routes } from '../data/routes'
import { sqaSchoolId } from '../data/test-users'
import { SLOW_PAGE_TIMEOUT } from '../utils/timeouts'

import type { Locator } from '@playwright/test'

const COPIED_TEXT_KEY = '__e2eCopiedText'

// A string because the qa tsconfig has no DOM lib
const CAPTURE_CLIPBOARD_WRITES = `navigator.clipboard.writeText = async (text) => {
  window.${COPIED_TEXT_KEY} = text
}`

// Loan detail of the school dashboard, as the agent sees it
export class LoanDetailPage extends BasePage {
  get shareSection(): Locator {
    return this.page.getByTestId('school-loan-detail-share-section')
  }

  get shareCopyButton(): Locator {
    return this.page.getByTestId('school-loan-detail-share-copy-button')
  }

  get closeButton(): Locator {
    return this.page.getByTestId('school-loan-detail-close-button')
  }

  // The confirmation dialog has no data-test-ids
  get closeConfirmButton(): Locator {
    return this.page
      .getByRole('alertdialog')
      .getByRole('button', { name: appLabels.closeLoanConfirm, exact: true })
  }

  get reopenButton(): Locator {
    return this.page.getByTestId('school-loan-detail-reopen-button')
  }

  get financialEditButton(): Locator {
    return this.page.getByTestId('school-loan-detail-financial-edit-button')
  }

  get studentEditButton(): Locator {
    return this.page.getByTestId('school-loan-detail-student-edit-button')
  }

  get studentExternalId(): Locator {
    return this.page.getByTestId('school-loan-detail-student-external-id').getByRole('textbox')
  }

  get studentFirstName(): Locator {
    return this.page.getByTestId('school-loan-detail-student-first-name-value')
  }

  get studentLastName(): Locator {
    return this.page.getByTestId('school-loan-detail-student-last-name-value')
  }

  get studentDocumentNumber(): Locator {
    return this.page.getByTestId('school-loan-detail-student-identification-number-value')
  }

  get studentAddress(): Locator {
    return this.page.getByTestId('school-loan-detail-student-address-value')
  }

  get studentCity(): Locator {
    return this.page.getByTestId('school-loan-detail-student-city-value')
  }

  get studentZipCode(): Locator {
    return this.page.getByTestId('school-loan-detail-student-zipcode-value')
  }

  async goto(loanId: string): Promise<void> {
    await this.page.goto(routes.loanDetail(sqaSchoolId, loanId))
  }

  async open(loanId: string): Promise<void> {
    await this.goto(loanId)
    await this.waitForLoaded()
  }

  // Any loan: the creation form lands here with an id the test does not know yet
  async waitForLoaded(): Promise<void> {
    await this.page.waitForURL(`**${routes.loanDetail(sqaSchoolId, '*')}`, {
      timeout: SLOW_PAGE_TIMEOUT
    })
    await this.waitUntilVisible(this.shareSection)
  }

  // A reload reads the loan from the server instead of the client cache
  async reloadFromServer(): Promise<void> {
    await this.page.reload()
    await this.waitForLoaded()
  }

  currentLoanId(): string {
    const loanId = new URL(this.page.url()).pathname.match(/\/loan\/(\d+)\/detail$/)?.[1]

    if (!loanId) {
      throw new Error(`The current URL is not a loan detail page: ${this.page.url()}`)
    }

    return loanId
  }

  async captureClipboardWrites(): Promise<void> {
    await this.page.addInitScript(CAPTURE_CLIPBOARD_WRITES)
  }

  async copyStudentLink(): Promise<string> {
    await this.shareCopyButton.click()
    await expect
      .poll(() => this.readCopiedText(), { message: 'student link copied' })
      .toContain(routes.signup)

    return this.readCopiedText()
  }

  async closeLoan(): Promise<void> {
    await this.closeButton.click()
    await this.closeConfirmButton.click()
  }

  async openFinancialEdit(): Promise<void> {
    await this.openEditFrom(this.financialEditButton)
  }

  async openStudentEdit(): Promise<void> {
    await this.openEditFrom(this.studentEditButton)
  }

  private async openEditFrom(editButton: Locator): Promise<void> {
    await editButton.click()
    await this.page.waitForURL(`**${routes.loanEdit(sqaSchoolId, '*')}`)
  }

  private async readCopiedText(): Promise<string> {
    return this.page.evaluate<string>(`window.${COPIED_TEXT_KEY} ?? ''`)
  }
}
