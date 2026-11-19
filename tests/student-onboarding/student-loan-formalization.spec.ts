import { Severity } from 'allure-js-commons'

import { expectTaskLocked } from '../../assertions/loan-request'
import { stripeTestCards } from '../../data/stripe-test-cards'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import {
  FORMALIZATION_TEST_TIMEOUT,
  THIRD_PARTY_PAGE_TIMEOUT,
  WEBHOOK_TIMEOUT
} from '../../utils/timeouts'

test.describe.configure({ timeout: FORMALIZATION_TEST_TIMEOUT })

test.beforeEach(() => annotateSuite('Financing', 'Student onboarding'))

test.describe(
  'Student loan formalization',
  { tag: [TAG.regression, TAG.loans, TAG.student] },
  () => {
    test(
      'allows a student to sign, pay and start the identity check until the financing is granted',
      { tag: TAG.formalization },
      async ({
        studentInFormalization,
        loanRequestPage,
        contractSigningPage,
        stripeCheckoutPage,
        kycPage,
        studentLoanDetailPage,
        studentLoansApi,
        usersApi
      }) => {
        await annotate({
          story: 'Student formalization of an installment financing without deferral',
          severity: Severity.BLOCKER
        })

        const { loanId, fullName } = studentInFormalization

        await test.step('the identity check starts locked and the contract is ready to sign', async () => {
          await expectTaskLocked(loanRequestPage.kycTask, true)
          await expectTaskLocked(loanRequestPage.signingTask, false)
        })

        await test.step('the student signs the contract in PandaDoc', async () => {
          await loanRequestPage.openSigningTask(loanId)
          await contractSigningPage.waitForLoaded()
          await contractSigningPage.sign()

          // PandaDoc tells the app the document is completed, and the app goes back to the request
          await loanRequestPage.waitForFormalization(loanId)
          await expect(loanRequestPage.signingTaskCompletedMark).toBeVisible({
            timeout: WEBHOOK_TIMEOUT
          })
          await expectTaskLocked(
            loanRequestPage.kycTask,
            true,
            'identity check still waits for the first payment'
          )
        })

        await test.step('the student pays the first installment in Stripe', async () => {
          await loanRequestPage.openFirstPaymentTask()
          await stripeCheckoutPage.waitForLoaded()
          await stripeCheckoutPage.payWithCard(stripeTestCards.visaSuccess, fullName)

          await loanRequestPage.waitForFormalization(loanId)
          await expect(loanRequestPage.firstPaymentTaskCompletedMark).toBeVisible({
            timeout: WEBHOOK_TIMEOUT
          })
          await expectTaskLocked(loanRequestPage.kycTask, false)
        })

        await test.step('the student opens the identity check in Permisso', async () => {
          await loanRequestPage.openKycTask(loanId)
          await kycPage.waitForLoaded()
          await kycPage.openVerification(loanId)

          await expect(kycPage.verificationFrame).toBeVisible({ timeout: THIRD_PARTY_PAGE_TIMEOUT })
        })

        await test.step('shortcut: an internal agent approves the KYC through the API', async () => {
          const userId = await studentLoansApi.getUserId(loanId)

          await usersApi.approveKyc(userId)
        })

        await test.step('the student sees the financing granted', async () => {
          await loanRequestPage.goto(loanId)

          await studentLoanDetailPage.waitForGranted(loanId)
          await expect(studentLoanDetailPage.financialApprovedModal).toBeVisible()
        })
      }
    )
  }
)
