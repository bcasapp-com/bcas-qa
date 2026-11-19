import { apiUrl, parseApiResponse } from './api-client'
import { SPAIN_CODE } from '../data/countries'
import { identityDocuments } from '../data/identity-documents'
import { sqaCourseId, sqaSchoolId } from '../data/test-users'

import type { OptionalStudentData } from '../data/loan-form-data'
import type { APIRequestContext } from '@playwright/test'

interface BasicLoanRequest {
  email: string
  phone: string
  amount: string
  installments: string
}

interface CreateLoanRequest extends BasicLoanRequest {
  student: OptionalStudentData
}

interface SchoolLoanResponse {
  totalAmountFinanced: number | string | null
  selectedInstallments: number | null
  eligibleInstallments: number[] | null
  user: {
    firstName: string | null
    lastName: string | null
    phone: string | null
    address: string | null
    city: string | null
    zipCode: string | null
  }
}

export interface SchoolLoan {
  totalAmountFinanced: number | null
  selectedInstallments: number | null
  eligibleInstallments: number[] | null
  user: SchoolLoanResponse['user']
}

export class SchoolLoansApi {
  constructor(private readonly request: APIRequestContext) {}

  async createInstallmentLoan({ student, ...loan }: CreateLoanRequest): Promise<string> {
    if (student.document !== identityDocuments.dni) {
      throw new Error(`Only DNI students are supported, got "${student.document.label}"`)
    }

    return this.createLoan(loan, student.externalId, {
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: `${student.dateOfBirth}T00:00:00.000Z`,
      identificationDocumentType: identityDocuments.dni.value,
      identificationNumber: student.documentNumber,
      nationality: SPAIN_CODE,
      address: student.address.stored.address,
      city: student.address.stored.city,
      zipCode: student.address.stored.zipCode
    })
  }

  async createBasicInstallmentLoan(loan: BasicLoanRequest): Promise<string> {
    return this.createLoan(loan, null, {})
  }

  private async createLoan(
    { email, phone, amount, installments }: BasicLoanRequest,
    externalId: string | null,
    studentFields: Record<string, string>
  ): Promise<string> {
    const response = await this.request.post(apiUrl('loans/school-dashboard'), {
      data: {
        schoolId: sqaSchoolId,
        courseId: sqaCourseId,
        loanType: 'installment_payments',
        totalAmountFinanced: Number(amount),
        selectedInstallments: Number(installments),
        eligibleInstallments: null,
        commissioner: 'STUDENT',
        selectedDeferralDate: null,
        externalId,
        user: {
          email,
          phone: `+34${phone}`,
          residenceCountry: SPAIN_CODE,
          ...studentFields
        }
      }
    })
    const { id } = await parseApiResponse<{ id?: number | string }>(response, 'Loan creation')

    if (id === undefined || id === null || id === '') {
      throw new Error('Loan creation succeeded but the response has no loan id')
    }

    return String(id)
  }

  async getLoan(loanId: string): Promise<SchoolLoan> {
    const loan = await parseApiResponse<SchoolLoanResponse>(
      await this.request.get(apiUrl(`loans/${loanId}/school-dashboard`)),
      `Loan ${loanId} lookup`
    )

    return {
      totalAmountFinanced:
        loan.totalAmountFinanced === null ? null : Number(loan.totalAmountFinanced),
      selectedInstallments: loan.selectedInstallments,
      eligibleInstallments: loan.eligibleInstallments,
      user: {
        firstName: loan.user.firstName,
        lastName: loan.user.lastName,
        phone: loan.user.phone,
        address: loan.user.address,
        city: loan.user.city,
        zipCode: loan.user.zipCode
      }
    }
  }
}
