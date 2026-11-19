import { BasePage } from './base-page'
import { LoanForm } from './components/loan-form'
import { routes } from '../data/routes'
import { sqaSchoolId } from '../data/test-users'

export class NewLoanPage extends BasePage {
  readonly form = new LoanForm(this.page)

  async goto(): Promise<void> {
    await this.page.goto(routes.newLoan(sqaSchoolId))
  }

  async open(): Promise<void> {
    await this.goto()
    await this.waitForLoaded()
  }

  async waitForLoaded(): Promise<void> {
    await this.waitForPathOrBelow(routes.newLoan(sqaSchoolId))
    await this.form.waitForLoaded()
  }
}
