import { Severity } from 'allure-js-commons'

import { expectLoanDetailShowsStudent } from '../../assertions/loan-detail'
import { expectAmountLimitEnforced } from '../../assertions/loan-form'
import { errorMessages } from '../../data/error-messages'
import {
  AMOUNT_LIMIT_SCENARIOS,
  editedStudentData,
  installmentOptions,
  invalidEditValues,
  loanAmountOptions
} from '../../data/loan-form-data'
import { routes } from '../../data/routes'
import { sqaSchoolId } from '../../data/test-users'
import { AGENT_STORAGE_STATE } from '../../fixtures/storage-states'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import { SLOW_PAGE_TIMEOUT, SLOW_TEST_TIMEOUT } from '../../utils/timeouts'
import { urlPath } from '../../utils/url'

import type { LoanForm } from '../../pages/components/loan-form'

// The app lets these values reach the submit and rejects them with a toast
interface InvalidEditScenario {
  label: string
  enterInvalidValue: (form: LoanForm) => Promise<void>
  toastMessage: string
}

const INVALID_EDIT_SCENARIOS: InvalidEditScenario[] = [
  {
    label: 'address typed without picking a suggestion',
    enterInvalidValue: (form) => form.address.search(invalidEditValues.unconfirmedAddress),
    toastMessage: errorMessages.addressNotConfirmed
  },
  {
    label: 'invalid phone number',
    enterInvalidValue: (form) => form.fillPhone(invalidEditValues.phone),
    toastMessage: errorMessages.invalidPhone
  }
]

test.use({ storageState: AGENT_STORAGE_STATE })
test.describe.configure({ timeout: SLOW_TEST_TIMEOUT })

test.beforeEach(() => annotateSuite('Financing', 'Edit financing'))

test.describe('Edit Loan Page', { tag: [TAG.regression, TAG.loans] }, () => {
  test('allows an agent to edit the student data of a loan', async ({
    createdLoan,
    editLoanPage,
    loanDetailPage
  }) => {
    await annotate({
      story: 'Edition of the student data of a financing',
      severity: Severity.CRITICAL
    })

    await loanDetailPage.open(createdLoan.loanId)
    await loanDetailPage.openStudentEdit()
    await editLoanPage.waitForLoaded()
    await editLoanPage.form.fillStudentPersonalData(editedStudentData)

    await editLoanPage.form.submitButton.click()

    await loanDetailPage.waitForLoaded()
    await loanDetailPage.reloadFromServer()
    // Fields left untouched in the edit must keep their value
    await expectLoanDetailShowsStudent(loanDetailPage, {
      ...createdLoan.student,
      ...editedStudentData
    })
  })

  test('allows an agent to edit the amount and installments of a loan', async ({
    createdLoan,
    editLoanPage,
    loanDetailPage,
    schoolLoansApi
  }) => {
    await annotate({
      story: 'Edition of the financial proposal of a financing',
      severity: Severity.CRITICAL
    })

    const addedInstallments = installmentOptions.months12
    expect(createdLoan.installments, 'precondition: the added option is not preselected').not.toBe(
      addedInstallments
    )

    await loanDetailPage.open(createdLoan.loanId)
    await loanDetailPage.openFinancialEdit()
    await editLoanPage.waitForLoaded()
    await editLoanPage.form.fillAmount(loanAmountOptions.partialAmount)
    await editLoanPage.form.toggleInstallment(addedInstallments)

    await editLoanPage.form.submitButton.click()

    await loanDetailPage.waitForLoaded()

    const storedLoan = await schoolLoansApi.getLoan(createdLoan.loanId)
    expect(storedLoan.totalAmountFinanced).toBe(Number(loanAmountOptions.partialAmount))

    expect(storedLoan.selectedInstallments).toBeNull()
    expect(storedLoan.eligibleInstallments).toHaveLength(2)
    expect(storedLoan.eligibleInstallments).toEqual(
      expect.arrayContaining([Number(createdLoan.installments), Number(addedInstallments)])
    )
  })

  for (const scenario of AMOUNT_LIMIT_SCENARIOS) {
    test(
      `does not allow an agent to edit a loan to an amount ${scenario.label}`,
      { tag: TAG.validation },
      async ({ createdLoan, editLoanPage }) => {
        await annotate({
          story: 'Rejection of out-of-range amounts when editing a financing',
          severity: Severity.CRITICAL
        })

        await editLoanPage.open(createdLoan.loanId)

        await expectAmountLimitEnforced(editLoanPage.form, scenario)
      }
    )
  }

  test(
    'does not save invalid student data when editing a loan',
    { tag: TAG.validation },
    async ({ createdLoan, page, editLoanPage, schoolLoansApi }) => {
      await annotate({
        story: 'Rejection of invalid data when editing a financing',
        severity: Severity.NORMAL
      })

      const loanBeforeEdits = await schoolLoansApi.getLoan(createdLoan.loanId)

      for (const scenario of INVALID_EDIT_SCENARIOS) {
        await test.step(scenario.label, async () => {
          await editLoanPage.open(createdLoan.loanId)

          await scenario.enterInvalidValue(editLoanPage.form)
          await editLoanPage.form.submitButton.click()

          await expect(editLoanPage.form.toast.withMessage(scenario.toastMessage)).toBeVisible()
          await expect(page).toHaveURL(urlPath(routes.loanEdit(sqaSchoolId, createdLoan.loanId)))
          expect(await schoolLoansApi.getLoan(createdLoan.loanId), 'stored loan unchanged').toEqual(
            loanBeforeEdits
          )
        })
      }
    }
  )

  test('keeps the loan unchanged when the agent leaves the edit without saving', async ({
    createdLoan,
    page,
    editLoanPage,
    loanDetailPage
  }) => {
    await annotate({
      story: 'Leaving the edition of a financing without saving',
      severity: Severity.NORMAL
    })

    await loanDetailPage.open(createdLoan.loanId)
    await loanDetailPage.openStudentEdit()
    await editLoanPage.waitForLoaded()
    await editLoanPage.form.fillStudentPersonalData(editedStudentData)

    await editLoanPage.form.leaveAndCancel()

    await expect(page).toHaveURL(urlPath(routes.loanEdit(sqaSchoolId, createdLoan.loanId)))
    await expect(editLoanPage.form.firstNameInput).toHaveValue(editedStudentData.firstName)

    await editLoanPage.form.leaveAndConfirm()

    await loanDetailPage.waitForLoaded()
    await expect(page).toHaveURL(urlPath(routes.loanDetail(sqaSchoolId, createdLoan.loanId)))
    await loanDetailPage.reloadFromServer()
    await expect(loanDetailPage.studentFirstName).toHaveText(createdLoan.student.firstName)
    await expect(loanDetailPage.studentCity).toHaveText(createdLoan.student.address.stored.city)
  })

  test(
    'does not allow an agent to edit a closed loan',
    { tag: TAG.security },
    async ({ createdLoan, page, editLoanPage, loanDetailPage }) => {
      await annotate({
        story: 'Edition blocked for a closed financing',
        severity: Severity.CRITICAL
      })

      await loanDetailPage.open(createdLoan.loanId)

      await expect(loanDetailPage.financialEditButton).toBeVisible()
      await expect(loanDetailPage.studentEditButton).toBeVisible()

      await loanDetailPage.closeLoan()

      await expect(loanDetailPage.reopenButton).toBeVisible()
      await expect(loanDetailPage.financialEditButton).toBeHidden()
      await expect(loanDetailPage.studentEditButton).toBeHidden()

      await editLoanPage.goto(createdLoan.loanId)

      await expect(page).toHaveURL(urlPath(routes.loanDetail(sqaSchoolId, createdLoan.loanId)), {
        timeout: SLOW_PAGE_TIMEOUT
      })
      await expect(loanDetailPage.reopenButton).toBeVisible()
    }
  )
})
