import { apiUrl, parseApiResponse } from './api-client'

import type { APIRequestContext } from '@playwright/test'

interface StudentLoanResponse {
  user: { id: number }
}

export class StudentLoansApi {
  constructor(private readonly request: APIRequestContext) {}

  async getUserId(loanId: string): Promise<number> {
    const loan = await parseApiResponse<StudentLoanResponse>(
      await this.request.get(apiUrl(`loans/${loanId}/user`)),
      `Student loan ${loanId} lookup`
    )

    return loan.user.id
  }
}
