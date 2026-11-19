import { BasePage } from './base-page'
import { routes } from '../data/routes'
import { WEBHOOK_TIMEOUT } from '../utils/timeouts'

import type { Locator } from '@playwright/test'

export class StudentLoanDetailPage extends BasePage {
  get financialApprovedModal(): Locator {
    return this.page.getByTestId('user-loan-financial-approved-modal')
  }

  get calendarTab(): Locator {
    return this.page.getByTestId('user-loan-detail-loan-calendar-tab')
  }

  // The request only moves to the loan detail once the approval webhook reaches the app
  async waitForGranted(loanId: string): Promise<void> {
    await this.waitForPath(routes.studentLoanDetail(loanId), WEBHOOK_TIMEOUT)
    await this.waitUntilVisible(this.calendarTab)
  }
}
