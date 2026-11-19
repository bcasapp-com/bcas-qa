import { test as browserTest } from './browser-fixtures'
import { CompleteProfilePage } from '../pages/complete-profile-page'
import { ContractSigningPage } from '../pages/contract-signing-page'
import { DashboardPage } from '../pages/dashboard-page'
import { EditLoanPage } from '../pages/edit-loan-page'
import { KycPage } from '../pages/kyc-page'
import { LoanDetailPage } from '../pages/loan-detail-page'
import { LoanPage } from '../pages/loan-page'
import { LoanRequestPage } from '../pages/loan-request-page'
import { LoginPage } from '../pages/login-page'
import { NewLoanPage } from '../pages/new-loan-page'
import { ResetPasswordPage } from '../pages/reset-password-page'
import { SchoolDashboardPage } from '../pages/school-dashboard-page'
import { SignupPage } from '../pages/signup-page'
import { StripeCheckoutPage } from '../pages/stripe-checkout-page'
import { StudentLoanDetailPage } from '../pages/student-loan-detail-page'

import type { Page } from '@playwright/test'

type PageObjectClass<T> = new (page: Page) => T

type UsePageObject<T> = (pageObject: T) => Promise<void>

// The default page: the one the storage state of the spec applies to
function onPage<T>(PageObject: PageObjectClass<T>) {
  return async ({ page }: { page: Page }, use: UsePageObject<T>): Promise<void> => {
    await use(new PageObject(page))
  }
}

// The agent's own browser context, for the specs that drive the agent and the student together
function onAgentPage<T>(PageObject: PageObjectClass<T>) {
  return async ({ agentPage }: { agentPage: Page }, use: UsePageObject<T>): Promise<void> => {
    await use(new PageObject(agentPage))
  }
}

// The student's own browser context, which starts without a session
function onStudentPage<T>(PageObject: PageObjectClass<T>) {
  return async ({ studentPage }: { studentPage: Page }, use: UsePageObject<T>): Promise<void> => {
    await use(new PageObject(studentPage))
  }
}

interface PageFixtures {
  loginPage: LoginPage
  dashboardPage: DashboardPage
  schoolDashboardPage: SchoolDashboardPage
  resetPasswordPage: ResetPasswordPage
  loanPage: LoanPage
  newLoanPage: NewLoanPage
  editLoanPage: EditLoanPage
  loanDetailPage: LoanDetailPage
  agentLoanDetailPage: LoanDetailPage
  signupPage: SignupPage
  loanRequestPage: LoanRequestPage
  completeProfilePage: CompleteProfilePage
  contractSigningPage: ContractSigningPage
  stripeCheckoutPage: StripeCheckoutPage
  kycPage: KycPage
  studentLoanDetailPage: StudentLoanDetailPage
}

// Page objects only: none of them navigates or changes data when created
export const test = browserTest.extend<PageFixtures>({
  loginPage: onPage(LoginPage),
  dashboardPage: onPage(DashboardPage),
  schoolDashboardPage: onPage(SchoolDashboardPage),
  resetPasswordPage: onPage(ResetPasswordPage),
  loanPage: onPage(LoanPage),
  newLoanPage: onPage(NewLoanPage),
  editLoanPage: onPage(EditLoanPage),
  loanDetailPage: onPage(LoanDetailPage),

  agentLoanDetailPage: onAgentPage(LoanDetailPage),

  signupPage: onStudentPage(SignupPage),
  loanRequestPage: onStudentPage(LoanRequestPage),
  completeProfilePage: onStudentPage(CompleteProfilePage),
  contractSigningPage: onStudentPage(ContractSigningPage),
  stripeCheckoutPage: onStudentPage(StripeCheckoutPage),
  kycPage: onStudentPage(KycPage),
  studentLoanDetailPage: onStudentPage(StudentLoanDetailPage)
})
