import { test as base, expect, mergeTests } from '@playwright/test'

import { test as apiTest } from './api-fixtures'
import { test as pageTest } from './page-fixtures'
import { expectProfileSaved } from '../assertions/student-profile'
import { documentRules } from '../data/identity-documents'
import {
  buildDniStudentData,
  buildGeneralLoanData,
  installmentOptions,
  loanAmountOptions
} from '../data/loan-form-data'
import { buildProfileFor } from '../data/student-profile-data'
import { studentSignupPassword } from '../data/test-users'
import { generateRandomEmail, generateSpanishPhone } from '../utils/test-data'

import type { OptionalStudentData } from '../data/loan-form-data'

interface CreatedLoan {
  loanId: string
  amount: string
  installments: string
  student: OptionalStudentData
}

interface SignedUpStudent {
  loanId: string
}

interface StudentInFormalization {
  loanId: string
  fullName: string
}

interface FlowFixtures {
  createdLoan: CreatedLoan
  signedUpStudent: SignedUpStudent
  studentInFormalization: StudentInFormalization
}

// Entry point for every spec: the page objects and API clients, plus the data each flow starts from
export const test = mergeTests(apiTest, pageTest).extend<FlowFixtures>({
  createdLoan: async ({ schoolLoansApi }, use) => {
    const student = buildDniStudentData()
    const amount = loanAmountOptions.completeAmount
    const installments = installmentOptions.months36
    const loanId = await schoolLoansApi.createInstallmentLoan({
      email: generateRandomEmail(),
      phone: generateSpanishPhone(),
      amount,
      installments,
      student
    })

    await use({ loanId, amount, installments, student })
  },
  // A loan with the basic data only, whose shared link the student signs up from. The loan is
  // created through the API, as its creation form is covered by the new loan spec
  signedUpStudent: async (
    { schoolLoansApi, agentLoanDetailPage, signupPage, loanRequestPage },
    use
  ) => {
    const loanData = buildGeneralLoanData()

    const loanId = await base.step('setup: create a loan with the basic data', () =>
      schoolLoansApi.createBasicInstallmentLoan(loanData)
    )

    const studentLink = await base.step('setup: the agent copies the student link', async () => {
      await agentLoanDetailPage.captureClipboardWrites()
      await agentLoanDetailPage.open(loanId)

      return agentLoanDetailPage.copyStudentLink()
    })

    // The link must belong to the student of this loan, and lead to this loan after signing up
    await base.step('setup: the student signs up from the link', async () => {
      await signupPage.open(studentLink)
      await expect(signupPage.emailInput).toHaveValue(loanData.email)
      await signupPage.signup(studentSignupPassword)
      await loanRequestPage.waitForLoaded(loanId)
    })

    await use({ loanId })
  },
  // The scoring and the evaluation run on their own in dev for a DNI student, so the request
  // reaches the formalization stage with the contract already generated
  studentInFormalization: async (
    { signedUpStudent, completeProfilePage, loanRequestPage },
    use
  ) => {
    const { loanId } = signedUpStudent
    const profile = buildProfileFor(documentRules.dni)

    await base.step('setup: the student completes the profile with a DNI', async () => {
      await loanRequestPage.openProfileTask(loanId)
      await completeProfilePage.waitForLoaded()
      await expectProfileSaved(await completeProfilePage.completeAndSave(profile))
      // Continue stays disabled until the task list shows the profile as completed
      await loanRequestPage.waitForProfileTaskCompleted(loanId)
    })

    await base.step('setup: the student moves the request to the formalization stage', () =>
      loanRequestPage.continueToFormalization(loanId)
    )

    await use({ loanId, fullName: `${profile.firstName} ${profile.lastName}` })
  }
})

export { expect }
