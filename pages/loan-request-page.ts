import { BasePage } from './base-page'
import { routes } from '../data/routes'
import { successMessages } from '../data/success-messages'
import { SLOW_PAGE_TIMEOUT } from '../utils/timeouts'

import type { Locator } from '@playwright/test'

export const LOCKED_TASK_ATTRIBUTE = 'data-blocked'

// Request of a loan in the student portal: the task list of each stage of the request
export class LoanRequestPage extends BasePage {
  get scoringSection(): Locator {
    return this.page.getByTestId('user-loan-request-scoring-section')
  }

  get profileTask(): Locator {
    return this.page.getByTestId('user-loan-request-profile-task')
  }

  get continueButton(): Locator {
    return this.page.getByTestId('user-loan-request-continue-button')
  }

  get reviewInProgressTitle(): Locator {
    return this.page.getByRole('heading', {
      name: successMessages.requestUnderReview,
      exact: true
    })
  }

  get formalizationSection(): Locator {
    return this.page.getByTestId('user-loan-request-resolution-section')
  }

  get signingTask(): Locator {
    return this.page.getByTestId('user-loan-request-signing-task')
  }

  get firstPaymentTask(): Locator {
    return this.page.getByTestId('user-loan-request-first-payment-task')
  }

  get kycTask(): Locator {
    return this.page.getByTestId('user-loan-request-kyc-task')
  }

  get profileTaskCompletedMark(): Locator {
    return this.completedMark(this.profileTask)
  }

  get signingTaskCompletedMark(): Locator {
    return this.completedMark(this.signingTask)
  }

  get firstPaymentTaskCompletedMark(): Locator {
    return this.completedMark(this.firstPaymentTask)
  }

  async goto(loanId: string): Promise<void> {
    await this.page.goto(routes.loanRequest(loanId))
  }

  async waitForLoaded(loanId: string): Promise<void> {
    await this.waitForPath(routes.loanRequest(loanId))
    await this.waitUntilVisible(this.scoringSection)
  }

  async waitForFormalization(loanId: string): Promise<void> {
    await this.waitForPath(routes.loanRequest(loanId))
    await this.waitUntilVisible(this.formalizationSection)
  }

  // The task list is refreshed a few seconds after landing, without any action from the student
  async waitForProfileTaskCompleted(loanId: string): Promise<void> {
    await this.waitForLoaded(loanId)
    await this.waitUntilVisible(this.profileTaskCompletedMark)
  }

  async openProfileTask(loanId: string): Promise<void> {
    await this.profileTask.click()
    await this.waitForPath(routes.completeProfile(loanId))
  }

  async openSigningTask(loanId: string): Promise<void> {
    await this.signingTask.click()
    await this.waitForPath(routes.signingContract(loanId))
  }

  // The card is a button that asks the server for a Stripe Checkout session and leaves the app
  async openFirstPaymentTask(): Promise<void> {
    await this.firstPaymentTask.click()
  }

  async openKycTask(loanId: string): Promise<void> {
    await this.kycTask.click()
    await this.waitForPath(routes.kycRecommendations(loanId))
  }

  async continueToFormalization(loanId: string): Promise<void> {
    await this.continueButton.click()
    await this.scoringSection.waitFor({ state: 'hidden', timeout: SLOW_PAGE_TIMEOUT })
    await this.continueButton.click({ timeout: SLOW_PAGE_TIMEOUT })
    await this.waitForFormalization(loanId)
  }

  // The task cards expose no completed state, only the check icon they render. Relies on the
  // Lucide icon class until the app adds a state attribute to the cards
  private completedMark(task: Locator): Locator {
    return task.locator('svg.lucide-circle-check-big')
  }
}
