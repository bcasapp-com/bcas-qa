import { Severity } from 'allure-js-commons'

import { expectProfileSaved } from '../../assertions/student-profile'
import { errorMessages } from '../../data/error-messages'
import {
  allowedNationalities,
  chooseNationality,
  documentRules,
  INVALID_DOCUMENT_NUMBER_SCENARIOS,
  nationalitiesNotOffered,
  notAllowedDocumentRules,
  validDocumentRules
} from '../../data/identity-documents'
import {
  allowedDocumentLabels,
  buildProfileFor,
  documentInForceLabel,
  unformattedDocumentNumber
} from '../../data/student-profile-data'
import { successMessages } from '../../data/success-messages'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite, recordTestData } from '../../utils/allure'
import { apiEndpoints, countApiRequests } from '../../utils/api-responses'
import { TAG } from '../../utils/tags'
import { SLOW_PAGE_TIMEOUT, TWO_PORTAL_TEST_TIMEOUT } from '../../utils/timeouts'

import type { Nationality } from '../../data/countries'
import type { DocumentRule, NationalityChoice } from '../../data/identity-documents'
import type { StudentProfileData } from '../../data/student-profile-data'
import type { CompleteProfilePage } from '../../pages/complete-profile-page'

const NATIONALITY_FILTER_RULES = [documentRules.cue, documentRules.tie, documentRules.redCard]

function nationalityCodes(nationalities: Nationality[]): string[] {
  return nationalities.map((nationality) => nationality.code).sort()
}

// The catalogue is every nationality the select offers before a document type is picked, so the
// profile must still have none
async function chooseProfileNationality(
  completeProfilePage: CompleteProfilePage,
  rule: DocumentRule
): Promise<NationalityChoice> {
  const catalogue = await completeProfilePage.readOfferedNationalities()
  const choice = chooseNationality(rule, catalogue)

  if (choice.toPick) {
    await recordTestData('Nationality', `${choice.toPick.name} (${choice.toPick.code})`)
  }

  return choice
}

// The date of birth is sent as an ISO timestamp
function expectedProfilePayload(
  profile: StudentProfileData,
  nationality: Nationality
): Record<string, unknown> {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: expect.stringMatching(new RegExp(`^${profile.dateOfBirth}`)),
    identificationDocumentType: profile.document.value,
    nationality: nationality.code,
    identificationNumber: profile.documentNumber,
    address: profile.address.stored.address,
    zipCode: profile.address.stored.zipCode,
    city: profile.address.stored.city,
    residenceCountry: profile.address.stored.residenceCountry
  }
}

test.describe.configure({ timeout: TWO_PORTAL_TEST_TIMEOUT })

test.beforeEach(() => annotateSuite('Financing', 'Student onboarding'))

test.describe('Student complete profile', { tag: [TAG.regression, TAG.loans, TAG.student] }, () => {
  test.beforeEach(async ({ signedUpStudent, loanRequestPage, completeProfilePage }) => {
    await test.step('setup: the student opens the profile task', async () => {
      await loanRequestPage.openProfileTask(signedUpStudent.loanId)
      await completeProfilePage.waitForLoaded()
    })
  })

  for (const rule of validDocumentRules) {
    test(`allows a student to complete the profile with a valid ${rule.testName}`, async ({
      signedUpStudent,
      completeProfilePage,
      loanRequestPage
    }) => {
      await annotate({
        story: 'Student profile completion from the shared financing link',
        severity: Severity.CRITICAL
      })

      const nationality = await chooseProfileNationality(completeProfilePage, rule)
      const profile = buildProfileFor(rule, { nationality: nationality.toPick })

      await expect(completeProfilePage.documentInForceCheckbox).toHaveAccessibleName(
        documentInForceLabel
      )
      await expect(completeProfilePage.documentInForceCheckbox).not.toBeChecked()

      await completeProfilePage.fillProfile(profile)

      await expect(completeProfilePage.nationalitySelect).toHaveValue(nationality.expected.name)
      if (rule.lockedNationalityCode) {
        await expect(completeProfilePage.nationalitySelect).toBeDisabled()
      }
      await expect(completeProfilePage.documentInForceCheckbox).toBeChecked()
      await expect(completeProfilePage.submitButton).toBeEnabled()

      const saveResponse = await completeProfilePage.submitAndWaitForSave()

      await expectProfileSaved(saveResponse, expectedProfilePayload(profile, nationality.expected))
      await expect(
        completeProfilePage.toast.withMessage(successMessages.profileSaved)
      ).toBeVisible()
      await loanRequestPage.waitForLoaded(signedUpStudent.loanId)
      // The task list is refreshed a few seconds after landing, without any action from the student
      await expect(loanRequestPage.profileTaskCompletedMark).toBeVisible({
        timeout: SLOW_PAGE_TIMEOUT
      })
      await expect(loanRequestPage.continueButton).toBeEnabled()

      await loanRequestPage.continueButton.click()

      await expect(loanRequestPage.reviewInProgressTitle).toBeVisible({
        timeout: SLOW_PAGE_TIMEOUT
      })
      await expect(loanRequestPage.scoringSection).toBeHidden()
    })
  }

  for (const scenario of INVALID_DOCUMENT_NUMBER_SCENARIOS) {
    test(
      `does not allow a student to complete the profile with an invalid ${scenario.rule.testName} number (${scenario.reason})`,
      { tag: TAG.validation },
      async ({ completeProfilePage, studentPage }) => {
        await annotate({
          story: 'Rejection of invalid document numbers in the student profile',
          severity: Severity.NORMAL
        })

        const saveRequestCount = countApiRequests(studentPage, apiEndpoints.completeProfile)
        const nationality = await chooseProfileNationality(completeProfilePage, scenario.rule)

        await completeProfilePage.fillProfile(
          buildProfileFor(scenario.rule, {
            nationality: nationality.toPick,
            documentNumber: scenario.documentNumber
          })
        )

        await expect(completeProfilePage.identificationNumberError).toHaveText(
          errorMessages.invalidDocumentNumber
        )
        await expect(completeProfilePage.identificationNumberInput).toHaveValue(
          scenario.documentNumber
        )
        await expect(completeProfilePage.submitButton).toBeDisabled()

        await completeProfilePage.identificationNumberInput.press('Enter')
        await expect(completeProfilePage.form).toBeVisible()

        // The number is the only thing blocking the form
        const validNumber = scenario.rule.generateValidNumber()
        await completeProfilePage.fillIdentificationNumber(validNumber)

        await expect(completeProfilePage.identificationNumberError).toBeHidden()
        await expect(completeProfilePage.submitButton).toBeEnabled()

        const saveResponse = await completeProfilePage.submitAndWaitForSave()

        await expectProfileSaved(saveResponse, { identificationNumber: validNumber })
        // Any request sent with the invalid number would have gone before this one
        expect(saveRequestCount(), 'profile save requests').toBe(1)
      }
    )
  }

  for (const rule of notAllowedDocumentRules) {
    test(
      `does not allow a student to complete the profile with a not allowed document type (${rule.testName})`,
      { tag: TAG.validation },
      async ({ completeProfilePage }) => {
        await annotate({
          story: 'Rejection of not allowed document types in the student profile',
          severity: Severity.CRITICAL
        })

        const nationality = await chooseProfileNationality(completeProfilePage, rule)

        // These document types skip the number validation, so the form can be submitted
        await completeProfilePage.fillProfile(
          buildProfileFor(rule, { nationality: nationality.toPick })
        )
        await expect(completeProfilePage.submitButton).toBeEnabled()
        await completeProfilePage.submitButton.click()

        const notice = completeProfilePage.blockedDocumentNotice
        await expect(notice.title).toHaveText(errorMessages.profileDocumentTypeNotAllowed)
        await expect(notice.validDocuments).toHaveText(allowedDocumentLabels)
        await expect(completeProfilePage.form).toBeHidden()

        // Nothing was saved: the profile read from the server is still empty
        await completeProfilePage.reloadFromServer()
        await expect(completeProfilePage.firstNameInput).toHaveValue('')
        await expect(completeProfilePage.identificationNumberInput).toHaveValue('')
      }
    )
  }

  test(
    'validates the number again when the student changes the document type',
    { tag: TAG.validation },
    async ({ completeProfilePage }) => {
      await annotate({
        story: 'Rejection of invalid document numbers in the student profile',
        severity: Severity.NORMAL
      })

      const tie = documentRules.tie
      // Read before the DNI locks the select
      const tieNationality = await chooseProfileNationality(completeProfilePage, tie)

      await completeProfilePage.fillProfile(buildProfileFor(documentRules.dni))
      await expect(completeProfilePage.submitButton, 'precondition: valid DNI').toBeEnabled()
      await expect(completeProfilePage.nationalitySelect, 'precondition: DNI').toBeDisabled()

      // A DNI number is not a valid NIE, which TIE expects
      await completeProfilePage.selectDocumentType(tie.document)

      await expect(completeProfilePage.identificationNumberError).toHaveText(
        errorMessages.invalidDocumentNumber
      )
      await expect(completeProfilePage.submitButton).toBeDisabled()
      await expect(completeProfilePage.nationalitySelect).toBeEnabled()

      const tieNumber = tie.generateValidNumber()
      await completeProfilePage.selectNationality(tieNationality.expected)
      await completeProfilePage.fillIdentificationNumber(tieNumber)

      await expect(completeProfilePage.identificationNumberError).toBeHidden()
      await expect(completeProfilePage.submitButton).toBeEnabled()

      // The save takes the document type picked last, not the one the profile started with
      const saveResponse = await completeProfilePage.submitAndWaitForSave()

      await expectProfileSaved(saveResponse, {
        identificationDocumentType: tie.document.value,
        nationality: tieNationality.expected.code,
        identificationNumber: tieNumber
      })
    }
  )

  test(
    'only offers the nationalities allowed for each document type',
    { tag: TAG.validation },
    async ({ completeProfilePage }) => {
      await annotate({
        story: 'Nationalities offered for each document type in the student profile',
        severity: Severity.NORMAL
      })

      const catalogue = await completeProfilePage.readOfferedNationalities()

      for (const rule of NATIONALITY_FILTER_RULES) {
        await test.step(rule.document.label, async () => {
          // Without nationalities to leave out, the check below would prove nothing
          expect(
            nationalitiesNotOffered(rule, catalogue),
            'nationalities not offered'
          ).not.toHaveLength(0)

          await completeProfilePage.selectDocumentType(rule.document)
          const offered = await completeProfilePage.readOfferedNationalities()

          expect
            .soft(nationalityCodes(offered), `nationalities offered for ${rule.testName}`)
            .toEqual(nationalityCodes(allowedNationalities(rule, catalogue)))
        })
      }
    }
  )

  test(
    'cleans up the document number typed by the student',
    { tag: TAG.validation },
    async ({ completeProfilePage }) => {
      await annotate({
        story: 'Document number format in the student profile',
        severity: Severity.NORMAL
      })

      const tie = documentRules.tie
      const nationality = await chooseProfileNationality(completeProfilePage, tie)

      await completeProfilePage.fillProfile(
        buildProfileFor(tie, {
          nationality: nationality.toPick,
          documentNumber: unformattedDocumentNumber.typed
        })
      )

      await expect(completeProfilePage.identificationNumberInput).toHaveValue(
        unformattedDocumentNumber.cleaned
      )
      await expect(completeProfilePage.submitButton).toBeEnabled()
    }
  )

  test(
    'requires the student to confirm that the document is in force',
    { tag: TAG.validation },
    async ({ signedUpStudent, completeProfilePage, studentPage, loanRequestPage }) => {
      await annotate({
        story: 'Document in force confirmation in the student profile',
        severity: Severity.NORMAL
      })

      const saveRequestCount = countApiRequests(studentPage, apiEndpoints.completeProfile)
      const dni = documentRules.dni
      const nationality = await chooseProfileNationality(completeProfilePage, dni)
      const profile = buildProfileFor(dni)

      await completeProfilePage.fillProfile(profile)
      await completeProfilePage.documentInForceCheckbox.uncheck()
      await completeProfilePage.submitButton.click()

      await expect(completeProfilePage.toast.withMessage(errorMessages.requiredField)).toBeVisible()
      await expect(completeProfilePage.documentInForceCheckbox).not.toBeChecked()
      // The rejected attempt keeps what the student typed
      await expect(completeProfilePage.firstNameInput).toHaveValue(profile.firstName)
      await expect(completeProfilePage.identificationNumberInput).toHaveValue(
        profile.documentNumber
      )

      await completeProfilePage.documentInForceCheckbox.check()

      const saveResponse = await completeProfilePage.submitAndWaitForSave()

      await expectProfileSaved(saveResponse, expectedProfilePayload(profile, nationality.expected))
      // Any request sent without the confirmation would have gone before this one
      expect(saveRequestCount(), 'profile save requests').toBe(1)
      await loanRequestPage.waitForLoaded(signedUpStudent.loanId)
    }
  )
})
