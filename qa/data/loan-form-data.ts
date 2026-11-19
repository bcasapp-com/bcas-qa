import { addresses } from './addresses'
import { errorMessages } from './error-messages'
import { documentRules } from './identity-documents'
import { optionalStudentData } from './student-profile-data'
import { generateExternalId, generateRandomEmail, generateSpanishPhone } from '../utils/test-data'

import type { AddressFixture } from './addresses'
import type { DocumentRule, IdentityDocument } from './identity-documents'

export interface GeneralLoanData {
  course: string
  loanType: string
  amount: string
  installments: string
  email: string
  phone: string
}

export interface OptionalStudentData {
  externalId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  document: IdentityDocument
  // Name shown in the form: the agent form offers no country codes
  nationality?: string
  documentNumber: string
  address: AddressFixture
}

export type StudentPersonalData = Pick<OptionalStudentData, 'firstName' | 'lastName' | 'address'>

const courseOptions = {
  cursoSqa: 'Curso de SQA',
  cursoSqaSinOneOff: 'Curso de SQA sin-oneOff'
} as const

const loanTypeOptions = {
  pap: 'Pago a plazos',
  isa: 'ISA'
} as const

export const installmentOptions = {
  months6: '6',
  months12: '12',
  months16: '16',
  months24: '24',
  months36: '36'
} as const

export const loanAmountOptions = {
  completeAmount: '1200',
  partialAmount: '1000'
} as const

// Curso de SQA in dev: the minimum is the global one, the maximum is the course PVP
const amountLimits = {
  belowMin: '499',
  min: '500',
  max: '1200',
  aboveMax: '1201'
} as const

export interface AmountLimitScenario {
  label: string
  rejectedAmount: string
  acceptedAmount: string
  warning: string
}

export const AMOUNT_LIMIT_SCENARIOS: AmountLimitScenario[] = [
  {
    label: 'above the maximum financeable amount',
    rejectedAmount: amountLimits.aboveMax,
    acceptedAmount: amountLimits.max,
    warning: errorMessages.amountAboveMax
  },
  {
    label: 'below the minimum financeable amount',
    rejectedAmount: amountLimits.belowMin,
    acceptedAmount: amountLimits.min,
    warning: errorMessages.amountBelowMin
  }
]

export const invalidEditValues = {
  unconfirmedAddress: 'Calle sin confirmar 1',
  phone: '123'
}

// A city other than the one the loan is created with, so a reverted edit is noticeable
export const editedStudentData: StudentPersonalData = {
  firstName: 'Editada',
  lastName: 'Modificada',
  address: addresses.passeigDeGracia43
}

export function buildGeneralLoanData(): GeneralLoanData {
  return {
    course: courseOptions.cursoSqa,
    loanType: loanTypeOptions.pap,
    amount: loanAmountOptions.completeAmount,
    installments: installmentOptions.months36,
    email: generateRandomEmail(),
    phone: generateSpanishPhone()
  }
}

export function buildOptionalStudentData(
  rule: DocumentRule,
  nationality?: string
): OptionalStudentData {
  return {
    ...optionalStudentData,
    externalId: generateExternalId(),
    document: rule.document,
    nationality,
    documentNumber: rule.generateValidNumber()
  }
}

// The app fills in the nationality of a DNI student on its own
export function buildDniStudentData(): OptionalStudentData {
  return buildOptionalStudentData(documentRules.dni)
}
