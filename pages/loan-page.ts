import { BasePage } from './base-page'
import { UserMenu } from './components/user-menu'
import { routes } from '../data/routes'

// First view of the student portal, where a student lands after logging in
export class LoanPage extends BasePage {
  readonly userMenu = new UserMenu(this.page)

  async waitForLoaded(): Promise<void> {
    await this.waitForPathOrBelow(routes.studentFirstView)
  }
}
