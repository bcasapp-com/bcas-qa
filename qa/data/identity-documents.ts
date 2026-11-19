import { isEuMember, SPAIN_CODE } from './countries'
import { generateValidDni, generateValidNie, pickRandom } from '../utils/test-data'

import type { Nationality } from './countries'

export interface IdentityDocument {
  // Option value in the student profile select
  value: string
  // Option text in both the agent loan form and the student profile
  label: string
}

export const identityDocuments = {
  dni: { value: 'dni', label: 'DNI' },
  cue: { value: 'cue', label: 'Documento Local + CUE (comunitarios)' },
  tie: { value: 'tie', label: 'TIE (extra-comunitario)' },
  redCard: { value: 'redCard', label: 'Tarjeta Roja' },
  nieInProcess: { value: 'nieInProcess', label: 'NIE en trámite (carta blanca sin foto)' }
} satisfies Record<string, IdentityDocument>

export interface DocumentRule {
  document: IdentityDocument
  // Short English name for test titles; changing it breaks the Allure history of those tests
  testName: string
  // The nationalities the app offers for the document, from the country code
  allowsNationality: (code: string) => boolean
  // The only nationality allowed, which the app fills in on its own while it disables the select
  lockedNationalityCode?: string
  generateValidNumber: () => string
}

const isSpanish = (code: string): boolean => code === SPAIN_CODE

type DocumentRuleName = keyof typeof identityDocuments

export const documentRules: Record<DocumentRuleName, DocumentRule> = {
  dni: {
    document: identityDocuments.dni,
    testName: 'DNI',
    allowsNationality: isSpanish,
    lockedNationalityCode: SPAIN_CODE,
    generateValidNumber: generateValidDni
  },
  cue: {
    document: identityDocuments.cue,
    testName: 'Local Document + CUE',
    allowsNationality: (code) => isEuMember(code) && !isSpanish(code),
    generateValidNumber: generateValidNie
  },
  tie: {
    document: identityDocuments.tie,
    testName: 'TIE',
    allowsNationality: (code) => !isEuMember(code),
    generateValidNumber: generateValidNie
  },
  redCard: {
    document: identityDocuments.redCard,
    testName: 'Tarjeta Roja',
    allowsNationality: (code) => !isSpanish(code),
    generateValidNumber: generateValidNie
  },
  nieInProcess: {
    document: identityDocuments.nieInProcess,
    testName: 'NIE en trámite',
    allowsNationality: (code) => !isSpanish(code),
    generateValidNumber: generateValidNie
  }
}

// The document types that let the student go on with the loan request
export const validDocumentRules: DocumentRule[] = [
  documentRules.dni,
  documentRules.cue,
  documentRules.tie
]

// The document types the app accepts in the form but that cannot get a loan
export const notAllowedDocumentRules: DocumentRule[] = [
  documentRules.redCard,
  documentRules.nieInProcess
]

export function allowedNationalities(rule: DocumentRule, catalogue: Nationality[]): Nationality[] {
  return catalogue.filter((nationality) => rule.allowsNationality(nationality.code))
}

export function nationalitiesNotOffered(
  rule: DocumentRule,
  catalogue: Nationality[]
): Nationality[] {
  return catalogue.filter((nationality) => !rule.allowsNationality(nationality.code))
}

export interface NationalityChoice {
  // The nationality the form must end up with
  expected: Nationality
  // The nationality the test has to pick; none when the app fills it in on its own
  toPick?: Nationality
}

export function chooseNationality(rule: DocumentRule, catalogue: Nationality[]): NationalityChoice {
  const allowed = allowedNationalities(rule, catalogue)

  if (rule.lockedNationalityCode) {
    const locked = allowed.find((nationality) => nationality.code === rule.lockedNationalityCode)

    if (!locked) {
      throw new Error(`${rule.lockedNationalityCode} is not in the nationality catalogue`)
    }

    return { expected: locked }
  }

  const picked = pickRandom(allowed, `nationalities allowed for ${rule.testName}`)

  return { expected: picked, toPick: picked }
}

// Exactly 9 characters: the document number input truncates anything longer
const invalidDocumentNumbers = {
  dni: {
    // 12345678 maps to control letter Z
    wrongControlLetter: '12345678A',
    // Expected format is 8 digits + 1 letter
    wrongFormat: '1234567AB'
  },
  // Used by Local Document + CUE and TIE
  nie: {
    // X1234567 maps to control letter L
    wrongControlLetter: 'X1234567A',
    // Expected format is X/Y/Z + 7 digits + 1 letter
    wrongFormat: 'A1234567B'
  }
}

export interface InvalidDocumentNumberScenario {
  rule: DocumentRule
  reason: string
  documentNumber: string
}

// Shared by the agent loan form and the student profile, which validate the number the same way
export const INVALID_DOCUMENT_NUMBER_SCENARIOS: InvalidDocumentNumberScenario[] = [
  {
    rule: documentRules.dni,
    reason: 'wrong control letter',
    documentNumber: invalidDocumentNumbers.dni.wrongControlLetter
  },
  {
    rule: documentRules.dni,
    reason: 'wrong format',
    documentNumber: invalidDocumentNumbers.dni.wrongFormat
  },
  {
    rule: documentRules.cue,
    reason: 'wrong control letter',
    documentNumber: invalidDocumentNumbers.nie.wrongControlLetter
  },
  {
    rule: documentRules.tie,
    reason: 'wrong format',
    documentNumber: invalidDocumentNumbers.nie.wrongFormat
  }
]
