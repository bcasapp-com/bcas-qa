import { expect } from '@playwright/test'

import { AddressAutocomplete } from './address-autocomplete'
import { Toast } from './toast'
import { SLOW_PAGE_TIMEOUT } from '../../utils/timeouts'

import type { IdentityDocument } from '../../data/identity-documents'
import type {
  GeneralLoanData,
  OptionalStudentData,
  StudentPersonalData
} from '../../data/loan-form-data'
import type { Locator, Page } from '@playwright/test'

// Shared by the new loan and the edit loan pages, which render the same form
export class LoanForm {
  readonly toast: Toast
  readonly address: AddressAutocomplete

  constructor(private readonly page: Page) {
    this.toast = new Toast(page)
    this.address = new AddressAutocomplete(page, 'school-loan-create-optional-address')
  }

  get root(): Locator {
    return this.page.getByTestId('school-loan-create-form')
  }

  get courseSelect(): Locator {
    return this.page.getByTestId('school-loan-create-general-course-select')
  }

  get loanTypeSelect(): Locator {
    return this.page.getByTestId('school-loan-create-general-loan-type-select')
  }

  get amountInput(): Locator {
    return this.page.getByTestId('school-loan-create-general-amount-input')
  }

  get installmentsSelect(): Locator {
    return this.page.getByTestId('school-loan-create-general-installments-select')
  }

  // The chevron has no test id; its spot is the only one in the box that cannot land on a chip's
  // remove button
  get installmentsChevron(): Locator {
    return this.installmentsSelect.locator('.lucide-chevron-down')
  }

  get phoneInput(): Locator {
    return this.page.getByTestId('school-loan-create-user-phone-input')
  }

  get emailInput(): Locator {
    return this.page.getByTestId('school-loan-create-user-email-input')
  }

  get submitButton(): Locator {
    return this.page.getByTestId('school-loan-create-form-submit-button')
  }

  get optionalDataTrigger(): Locator {
    return this.page.getByTestId('school-loan-create-optional-trigger')
  }

  get externalIdInput(): Locator {
    return this.page.getByTestId('school-loan-create-optional-external-id-input')
  }

  get firstNameInput(): Locator {
    return this.page.getByTestId('school-loan-create-optional-first-name-input')
  }

  get lastNameInput(): Locator {
    return this.page.getByTestId('school-loan-create-optional-last-name-input')
  }

  get dateOfBirthInput(): Locator {
    return this.page.getByTestId('school-loan-create-optional-date-of-birth-input')
  }

  get nationalitySelect(): Locator {
    return this.page.getByTestId('school-loan-create-optional-nationality-select')
  }

  get documentTypeSelect(): Locator {
    return this.page.getByTestId('school-loan-create-optional-document-type-select')
  }

  get documentNumberInput(): Locator {
    return this.page.getByTestId('school-loan-create-optional-document-number-input')
  }

  get backButton(): Locator {
    return this.page.getByTestId('school-loan-create-header-back-button')
  }

  get backModalCancelButton(): Locator {
    return this.page.getByTestId('school-loan-create-header-modal-cancel-button')
  }

  get backModalConfirmButton(): Locator {
    return this.page.getByTestId('school-loan-create-header-modal-confirm-button')
  }

  fieldErrorMessage(message: string): Locator {
    return this.root.getByRole('alert').filter({ hasText: message })
  }

  amountWarning(message: string): Locator {
    return this.root.getByText(message, { exact: true })
  }

  async waitForLoaded(): Promise<void> {
    await this.courseSelect.waitFor({ state: 'visible', timeout: SLOW_PAGE_TIMEOUT })
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email)
  }

  async fillPhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone)
  }

  async selectCourse(course: string): Promise<void> {
    await this.pickOption(this.courseSelect, course)
  }

  async selectLoanType(loanType: string): Promise<void> {
    await this.pickOption(this.loanTypeSelect, loanType)
  }

  async fillAmount(amount: string): Promise<void> {
    await this.amountInput.click()
    await this.amountInput.clear()
    await this.amountInput.pressSequentially(amount)
  }

  async toggleInstallment(installments: string): Promise<void> {
    await this.openInstallments()
    await this.option(installments).click()
    await this.clickInstallmentsChevron()
    await this.page.getByRole('option').first().waitFor({ state: 'hidden' })
  }

  async fillGeneralData(data: GeneralLoanData): Promise<void> {
    await this.selectCourse(data.course)
    await this.selectLoanType(data.loanType)
    await this.fillAmount(data.amount)
    await this.toggleInstallment(data.installments)
    await this.fillEmail(data.email)
    await this.fillPhone(data.phone)
  }

  async expandOptionalData(): Promise<void> {
    await this.optionalDataTrigger.click()
  }

  async selectDocumentType(document: IdentityDocument): Promise<void> {
    await this.pickOption(this.documentTypeSelect, document.label)
  }

  // The names of the nationalities offered for the selected document type. The options carry no
  // country code, so the names are all the form exposes
  async readOfferedNationalities(): Promise<string[]> {
    await this.nationalitySelect.click()
    await this.page.getByRole('option').first().waitFor()
    const names = await this.page.getByRole('option').allTextContents()
    await this.nationalitySelect.press('Escape')
    await this.page.getByRole('option').first().waitFor({ state: 'hidden' })

    return names.map((name) => name.trim())
  }

  // The search narrows a long list, so the nationality is typed before it is picked
  async selectNationality(nationality: string): Promise<void> {
    await this.nationalitySelect.click()
    await this.nationalitySelect.fill(nationality)
    await this.option(nationality).click()
  }

  async fillDocumentNumber(documentNumber: string): Promise<void> {
    await this.documentNumberInput.fill(documentNumber)
    await this.documentNumberInput.blur()
  }

  async fillOptionalData(data: OptionalStudentData): Promise<void> {
    await this.externalIdInput.fill(data.externalId)
    await this.firstNameInput.fill(data.firstName)
    await this.lastNameInput.fill(data.lastName)
    await this.dateOfBirthInput.fill(data.dateOfBirth)
    await this.dateOfBirthInput.blur()
    await this.selectDocumentType(data.document)
    // The app resets nationality when the document type changes, so it must be picked after
    if (data.nationality) {
      await this.selectNationality(data.nationality)
    }
    await this.fillDocumentNumber(data.documentNumber)
    await this.address.searchAndConfirm(data.address.searchText)
  }

  async fillStudentPersonalData(data: StudentPersonalData): Promise<void> {
    await this.firstNameInput.fill(data.firstName)
    await this.lastNameInput.fill(data.lastName)
    await this.address.searchAndConfirm(data.address.searchText)
  }

  async leaveAndCancel(): Promise<void> {
    await this.backButton.click()
    await this.backModalCancelButton.click()
  }

  async leaveAndConfirm(): Promise<void> {
    await this.backButton.click()
    await this.backModalConfirmButton.click()
  }

  private option(name: string): Locator {
    return this.page.getByRole('option', { name, exact: true })
  }

  private async pickOption(select: Locator, name: string): Promise<void> {
    await select.click()
    await this.option(name).click()
  }

  // Reopened right after closing, the select can report itself expanded without rendering the
  // options, so it is closed and opened again until they show up
  private async openInstallments(): Promise<void> {
    await expect(async () => {
      if ((await this.installmentsSelect.getAttribute('aria-expanded')) === 'true') {
        await this.clickInstallmentsChevron()
      }
      await this.clickInstallmentsChevron()
      await this.page.getByRole('option').first().waitFor({ timeout: 2_000 })
    }).toPass({ timeout: SLOW_PAGE_TIMEOUT })
  }

  // The chevron ignores pointer events, so the click goes to the box at the chevron's position.
  // The position is read on every call because the box grows as chips are added
  private async clickInstallmentsChevron(): Promise<void> {
    await this.installmentsSelect.waitFor()
    const box = await this.installmentsSelect.boundingBox()
    const chevron = await this.installmentsChevron.boundingBox()

    if (!box || !chevron) {
      throw new Error('The installments select is not visible')
    }

    await this.installmentsSelect.click({
      position: {
        x: chevron.x - box.x + chevron.width / 2,
        y: chevron.y - box.y + chevron.height / 2
      }
    })
  }
}
