import { expect, test } from '@playwright/test'

import type { OptionalStudentData } from '../data/loan-form-data'
import type { LoanDetailPage } from '../pages/loan-detail-page'

type ShownStudentData = Pick<
  OptionalStudentData,
  'externalId' | 'firstName' | 'lastName' | 'documentNumber' | 'address'
>

export async function expectLoanDetailShowsStudent(
  loanDetailPage: LoanDetailPage,
  student: ShownStudentData
): Promise<void> {
  await test.step(
    'the loan detail shows the student data',
    async () => {
      await expect(loanDetailPage.studentExternalId).toHaveValue(student.externalId)
      await expect(loanDetailPage.studentFirstName).toHaveText(student.firstName)
      await expect(loanDetailPage.studentLastName).toHaveText(student.lastName)
      await expect(loanDetailPage.studentDocumentNumber).toHaveText(student.documentNumber)
      await expect(loanDetailPage.studentAddress).toHaveText(student.address.stored.address)
      await expect(loanDetailPage.studentCity).toHaveText(student.address.stored.city)
      await expect(loanDetailPage.studentZipCode).toHaveText(student.address.stored.zipCode)
    },
    { box: true }
  )
}
