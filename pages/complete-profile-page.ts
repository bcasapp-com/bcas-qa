import { BasePage } from './base-page'
import { AddressAutocomplete } from './components/address-autocomplete'
import { BlockedDocumentNotice } from './components/blocked-document-notice'
import { Toast } from './components/toast'
import { apiEndpoints, waitForApiResponse } from '../utils/api-responses'

import type { Nationality } from '../data/countries'
import type { IdentityDocument } from '../data/identity-documents'
import type { StudentProfileData } from '../data/student-profile-data'
import type { Locator, Response } from '@playwright/test'

const NATIONALITY_OPTION_TEST_ID = 'user-profile-nationality-select-option-'

export class CompleteProfilePage extends BasePage {
  readonly toast = new Toast(this.page)
  readonly blockedDocumentNotice = new BlockedDocumentNotice(this.page)
  readonly address = new AddressAutocomplete(this.page, 'user-profile-address')

  get form(): Locator {
    return this.page.getByTestId('user-profile-complete-form-desktop')
  }

  get firstNameInput(): Locator {
    return this.page.getByTestId('user-profile-first-name-input')
  }

  get lastNameInput(): Locator {
    return this.page.getByTestId('user-profile-last-name-input')
  }

  get dateOfBirthInput(): Locator {
    return this.page.getByTestId('user-profile-date-of-birth-input')
  }

  get documentTypeSelect(): Locator {
    return this.page.getByTestId('user-profile-document-type-select')
  }

  get documentInForceCheckbox(): Locator {
    return this.page.getByTestId('user-profile-document-in-force-checkbox')
  }

  get nationalitySelect(): Locator {
    return this.page.getByTestId('user-profile-nationality-select')
  }

  get identificationNumberInput(): Locator {
    return this.page.getByTestId('user-profile-identification-number-input')
  }

  // Stays under the input while the number is invalid, unlike the toast raised with it
  get identificationNumberError(): Locator {
    return this.page
      .getByTestId('user-profile-identification-number-input-container')
      .locator('#error-message')
  }

  get submitButton(): Locator {
    return this.page.getByTestId('user-profile-complete-submit-button')
  }

  // Only the nationalities allowed for the selected document type are rendered
  nationalityOption(nationality: Nationality): Locator {
    return this.page.getByTestId(`${NATIONALITY_OPTION_TEST_ID}${nationality.code}`)
  }

  private get nationalityOptions(): Locator {
    return this.page.getByTestId(new RegExp(`^${NATIONALITY_OPTION_TEST_ID}`))
  }

  async waitForLoaded(): Promise<void> {
    await this.waitUntilVisible(this.form)
  }

  // A reload reads the profile from the server instead of the client cache
  async reloadFromServer(): Promise<void> {
    await this.page.reload()
    await this.waitForLoaded()
  }

  async selectDocumentType(document: IdentityDocument): Promise<void> {
    await this.documentTypeSelect.click()
    await this.page
      .getByTestId(`user-profile-document-type-select-option-${document.value}`)
      .click()
  }

  // The nationalities offered for the selected document type, every country while none is
  // selected. Each option carries the country code in its test id and shows the country name
  async readOfferedNationalities(): Promise<Nationality[]> {
    await this.openNationalityOptions()
    await this.nationalityOptions.first().waitFor()
    const options = await this.nationalityOptions.evaluateAll(
      (elements, testIdPrefix) =>
        elements.map((element) => ({
          code: (element.getAttribute('data-test-id') ?? '').slice(testIdPrefix.length),
          name: (element.textContent ?? '').trim()
        })),
      NATIONALITY_OPTION_TEST_ID
    )
    await this.closeNationalityOptions()

    return options
  }

  async openNationalityOptions(): Promise<void> {
    await this.nationalitySelect.click()
  }

  async closeNationalityOptions(): Promise<void> {
    await this.nationalitySelect.press('Escape')
  }

  async selectNationality(nationality: Nationality): Promise<void> {
    await this.openNationalityOptions()
    await this.nationalitySelect.fill(nationality.name)
    await this.nationalityOption(nationality).click()
  }

  async fillIdentificationNumber(documentNumber: string): Promise<void> {
    await this.identificationNumberInput.fill(documentNumber)
    await this.identificationNumberInput.blur()
  }

  async fillProfile(data: StudentProfileData): Promise<void> {
    await this.firstNameInput.fill(data.firstName)
    await this.lastNameInput.fill(data.lastName)
    await this.dateOfBirthInput.fill(data.dateOfBirth)
    await this.dateOfBirthInput.blur()
    await this.selectDocumentType(data.document)
    await this.documentInForceCheckbox.check()
    // The app resets nationality when the document type changes, so it must be picked after
    if (data.nationality) {
      await this.selectNationality(data.nationality)
    }
    await this.address.searchAndConfirm(data.address.searchText)
    // Last, as its validation on blur reads the document type picked above
    await this.fillIdentificationNumber(data.documentNumber)
  }

  async submitAndWaitForSave(): Promise<Response> {
    const saveResponse = waitForApiResponse(this.page, apiEndpoints.completeProfile)
    await this.submitButton.click()

    return saveResponse
  }

  async completeAndSave(data: StudentProfileData): Promise<Response> {
    await this.fillProfile(data)

    return this.submitAndWaitForSave()
  }
}
