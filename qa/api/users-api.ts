import { apiUrl, parseApiResponse } from './api-client'

import type { APIRequestContext } from '@playwright/test'

export class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  async approveKyc(userId: number): Promise<void> {
    await parseApiResponse(
      await this.request.post(apiUrl(`users/${userId}/kyc-decision`), {
        data: { decision: 'COMPLETED' }
      }),
      `KYC approval of user ${userId}`
    )
  }
}
