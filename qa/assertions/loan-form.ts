import { expect, test } from '@playwright/test'

import type { AmountLimitScenario, OptionalStudentData } from '../data/loan-form-data'
import type { LoanForm } from '../pages/components/loan-form'

// Shared by the new loan and the edit loan forms, which apply the same amount limits
export async function expectAmountLimitEnforced(
  form: LoanForm,
  scenario: AmountLimitScenario
): Promise<void> {
  await test.step(
    `the form rejects an amount ${scenario.label}`,
    async () => {
      await form.fillAmount(scenario.rejectedAmount)

      await expect(form.amountWarning(scenario.warning)).toBeVisible()
      await expect(form.submitButton).toBeDisabled()

      // The limit itself is a valid amount
      await form.fillAmount(scenario.acceptedAmount)

      await expect(form.amountWarning(scenario.warning)).toBeHidden()
      await expect(form.submitButton).toBeEnabled()
    },
    { box: true }
  )
}

export async function expectLoanFormShowsStudent(
  form: LoanForm,
  student: OptionalStudentData,
  expectedNationality: string
): Promise<void> {
  await test.step(
    'the loan form shows the student data',
    async () => {
      await expect(form.dateOfBirthInput).toHaveValue(student.dateOfBirth)
      await expect(form.nationalitySelect).toHaveValue(expectedNationality)
      await expect(form.documentTypeSelect).toHaveText(student.document.label)
    },
    { box: true }
  )
}
