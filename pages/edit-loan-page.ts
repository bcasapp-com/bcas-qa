import { expect } from '@playwright/test'

import { BasePage } from './base-page'
import { LoanForm } from './components/loan-form'
import { routes } from '../data/routes'
import { sqaSchoolId } from '../data/test-users'
import { SLOW_PAGE_TIMEOUT } from '../utils/timeouts'

export class EditLoanPage extends BasePage {
  readonly form = new LoanForm(this.page)

  async goto(loanId: string): Promise<void> {
    await this.page.goto(routes.loanEdit(sqaSchoolId, loanId))
  }

  async open(loanId: string): Promise<void> {
    await this.goto(loanId)
    await this.waitForLoaded()
  }

  // The form is rendered empty first and filled once the loan arrives, and the submit button is
  // enabled after the loaded data passes the form validation
  async waitForLoaded(): Promise<void> {
    await this.form.waitForLoaded()
    await expect(this.form.emailInput, 'edit form filled with the loan data').not.toHaveValue('', {
      timeout: SLOW_PAGE_TIMEOUT
    })
    await expect(this.form.submitButton, 'edit form ready to submit').toBeEnabled({
      timeout: SLOW_PAGE_TIMEOUT
    })
  }
}
