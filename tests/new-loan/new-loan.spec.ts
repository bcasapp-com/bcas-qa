import { Severity } from 'allure-js-commons'

import { expectLoanDetailShowsStudent } from '../../assertions/loan-detail'
import { expectAmountLimitEnforced, expectLoanFormShowsStudent } from '../../assertions/loan-form'
import { countryName } from '../../data/countries'
import { errorMessages } from '../../data/error-messages'
import {
  INVALID_DOCUMENT_NUMBER_SCENARIOS,
  notAllowedDocumentRules,
  validDocumentRules
} from '../../data/identity-documents'
import {
  AMOUNT_LIMIT_SCENARIOS,
  buildGeneralLoanData,
  buildOptionalStudentData,
  installmentOptions
} from '../../data/loan-form-data'
import { routes } from '../../data/routes'
import { sqaSchoolId } from '../../data/test-users'
import { AGENT_STORAGE_STATE } from '../../fixtures/storage-states'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite, recordTestData } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import { pickRandom } from '../../utils/test-data'
import { SLOW_TEST_TIMEOUT } from '../../utils/timeouts'
import { urlPath } from '../../utils/url'

import type { DocumentRule } from '../../data/identity-documents'
import type { LoanForm } from '../../pages/components/loan-form'

interface OfferedNationality {
  // Name the form must end up with
  expected: string
  // Name the test has to pick; none when the app fills it in on its own
  toPick?: string
}

// The agent form offers names only, so the nationality is picked among the ones it offers for
// the document type. A locked nationality is not offered: the app fills it in
async function chooseOfferedNationality(
  form: LoanForm,
  rule: DocumentRule
): Promise<OfferedNationality> {
  if (rule.lockedNationalityCode) {
    return { expected: countryName(rule.lockedNationalityCode) }
  }

  await form.selectDocumentType(rule.document)
  const picked = pickRandom(
    await form.readOfferedNationalities(),
    `nationalities offered for ${rule.testName}`
  )
  await recordTestData('Nationality', picked)

  return { expected: picked, toPick: picked }
}

test.use({ storageState: AGENT_STORAGE_STATE })
test.describe.configure({ timeout: SLOW_TEST_TIMEOUT })

test.beforeEach(() => annotateSuite('Financing', 'New financing'))

test.describe('New Loan Page — navigation', { tag: [TAG.regression, TAG.loans] }, () => {
  test('allows an agent to open the new loan form from the school dashboard', async ({
    page,
    schoolDashboardPage,
    newLoanPage
  }) => {
    await annotate({
      story: 'Access to the new financing form from the school dashboard',
      severity: Severity.NORMAL
    })

    await schoolDashboardPage.open()
    await schoolDashboardPage.goToNewLoan()

    await newLoanPage.waitForLoaded()
    await expect(page).toHaveURL(urlPath(routes.newLoan(sqaSchoolId)))
  })
})

test.describe('New Loan Page', { tag: [TAG.regression, TAG.loans] }, () => {
  test.beforeEach(async ({ newLoanPage }) => {
    await newLoanPage.open()

    await newLoanPage.form.fillGeneralData(buildGeneralLoanData())

    await expect(newLoanPage.form.submitButton).toBeEnabled()
  })

  test('allows an agent to create a new loan with valid data', async ({
    newLoanPage,
    loanDetailPage
  }) => {
    await annotate({
      story: 'Creation of a new financing from the school dashboard',
      severity: Severity.CRITICAL
    })

    await newLoanPage.form.submitButton.click()

    await loanDetailPage.waitForLoaded()
    await expect(loanDetailPage.shareSection).toBeVisible()
  })

  test('allows an agent to create a new loan offering several installment options', async ({
    newLoanPage,
    loanDetailPage,
    schoolLoansApi
  }) => {
    await annotate({
      story: 'Creation of a new financing with several installment options',
      severity: Severity.CRITICAL
    })

    const preselectedInstallments = installmentOptions.months36
    const addedInstallments = [installmentOptions.months6, installmentOptions.months12]
    await expect(
      newLoanPage.form.installmentsSelect,
      'precondition: the base form selects a single option'
    ).toHaveText(preselectedInstallments)

    for (const installments of addedInstallments) {
      await newLoanPage.form.toggleInstallment(installments)
    }
    await newLoanPage.form.submitButton.click()

    await loanDetailPage.waitForLoaded()

    const storedLoan = await schoolLoansApi.getLoan(loanDetailPage.currentLoanId())

    expect(storedLoan.selectedInstallments).toBeNull()
    expect(storedLoan.eligibleInstallments).toHaveLength(addedInstallments.length + 1)
    expect(storedLoan.eligibleInstallments).toEqual(
      expect.arrayContaining([preselectedInstallments, ...addedInstallments].map(Number))
    )
  })

  for (const scenario of AMOUNT_LIMIT_SCENARIOS) {
    test(
      `does not allow an agent to create a new loan with an amount ${scenario.label}`,
      { tag: TAG.validation },
      async ({ newLoanPage }) => {
        await annotate({
          story: 'Rejection of out-of-range amounts when creating a new financing',
          severity: Severity.CRITICAL
        })

        await expectAmountLimitEnforced(newLoanPage.form, scenario)
      }
    )
  }

  for (const rule of validDocumentRules) {
    test(`allows an agent to create a new loan with all optional student data and a valid ${rule.testName}`, async ({
      newLoanPage,
      editLoanPage,
      loanDetailPage
    }) => {
      await annotate({
        story: 'Creation of a new financing with optional student data',
        severity: Severity.NORMAL
      })

      await newLoanPage.form.expandOptionalData()
      const nationality = await chooseOfferedNationality(newLoanPage.form, rule)
      const studentData = buildOptionalStudentData(rule, nationality.toPick)

      await newLoanPage.form.fillOptionalData(studentData)

      await expect(newLoanPage.form.nationalitySelect).toHaveValue(nationality.expected)
      if (rule.lockedNationalityCode) {
        await expect(newLoanPage.form.nationalitySelect).toBeDisabled()
      }
      await expect(newLoanPage.form.submitButton).toBeEnabled()
      await newLoanPage.form.submitButton.click()

      await loanDetailPage.waitForLoaded()
      await expect(loanDetailPage.shareSection).toBeVisible()
      await expectLoanDetailShowsStudent(loanDetailPage, studentData)

      await loanDetailPage.openStudentEdit()

      await expectLoanFormShowsStudent(editLoanPage.form, studentData, nationality.expected)
    })
  }

  for (const rule of notAllowedDocumentRules) {
    test(
      `does not allow an agent to create a new loan with an invalid document type (${rule.testName})`,
      { tag: TAG.validation },
      async ({ newLoanPage }) => {
        await annotate({
          story: 'Rejection of invalid document type when creating a new financing',
          severity: Severity.CRITICAL
        })

        await newLoanPage.form.expandOptionalData()
        await newLoanPage.form.selectDocumentType(rule.document)

        await expect(newLoanPage.form.submitButton).toBeDisabled()
        await expect(
          newLoanPage.form.toast.withMessage(errorMessages.loanFormInvalidDocumentType)
        ).toBeVisible()
      }
    )
  }

  for (const scenario of INVALID_DOCUMENT_NUMBER_SCENARIOS) {
    test(
      `does not allow an agent to create a new loan with an invalid ${scenario.rule.testName} number (${scenario.reason})`,
      { tag: TAG.validation },
      async ({ newLoanPage }) => {
        await annotate({
          story: 'Rejection of invalid document number format when creating a new financing',
          severity: Severity.NORMAL
        })

        await newLoanPage.form.expandOptionalData()
        await newLoanPage.form.selectDocumentType(scenario.rule.document)
        await newLoanPage.form.fillDocumentNumber(scenario.documentNumber)

        await expect(newLoanPage.form.documentNumberInput).toHaveValue(scenario.documentNumber)
        await expect(
          newLoanPage.form.fieldErrorMessage(errorMessages.invalidDocumentNumber)
        ).toBeVisible()
        await expect(newLoanPage.form.submitButton).toBeDisabled()
      }
    )
  }
})
