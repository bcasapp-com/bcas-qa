import { addresses } from './addresses'

import type { AddressFixture } from './addresses'
import type { Nationality } from './countries'
import type { DocumentRule, IdentityDocument } from './identity-documents'

export interface StudentProfileData {
  firstName: string
  lastName: string
  dateOfBirth: string
  document: IdentityDocument
  nationality?: Nationality
  documentNumber: string
  address: AddressFixture
}

export const optionalStudentData = {
  firstName: 'Prueba',
  lastName: 'Automatizada',
  dateOfBirth: '1995-05-15',
  address: addresses.granVia1
}

export const allowedDocumentLabels = [
  'DNI Español',
  'TIE (extra-comunitario)',
  'Documento local + CUE (comunitarios)'
]

export const documentInForceLabel = 'Confirmo que mi documentación no está vencida'

export const unformattedDocumentNumber = {
  typed: 'x1234567-lab',
  cleaned: 'X1234567L'
}

interface ProfileDocumentOptions {
  // Left out for the document types whose nationality the app fills in on its own
  nationality?: Nationality
  // A valid number for the document type unless the test needs another one
  documentNumber?: string
}

export function buildProfileFor(
  rule: DocumentRule,
  { nationality, documentNumber = rule.generateValidNumber() }: ProfileDocumentOptions = {}
): StudentProfileData {
  return { ...optionalStudentData, document: rule.document, nationality, documentNumber }
}
