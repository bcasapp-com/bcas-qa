import { test as browserTest } from './browser-fixtures'
import { AGENT_STORAGE_STATE, DASHBOARD_USER_STORAGE_STATE } from './storage-states'
import { SchoolLoansApi } from '../api/school-loans-api'
import { StudentLoansApi } from '../api/student-loans-api'
import { UsersApi } from '../api/users-api'

import type { APIRequestContext, PlaywrightWorkerArgs } from '@playwright/test'

type ApiClientClass<T> = new (request: APIRequestContext) => T

// An API client with the session saved by a setup project, in a request context of its own
function withSavedSession<T>(ApiClient: ApiClientClass<T>, storageState: string) {
  return async (
    { playwright }: Pick<PlaywrightWorkerArgs, 'playwright'>,
    use: (apiClient: T) => Promise<void>
  ): Promise<void> => {
    const request = await playwright.request.newContext({ storageState })

    await use(new ApiClient(request))

    await request.dispose()
  }
}

interface ApiFixtures {
  schoolLoansApi: SchoolLoansApi
  studentLoansApi: StudentLoansApi
  usersApi: UsersApi
}

export const test = browserTest.extend<ApiFixtures>({
  schoolLoansApi: withSavedSession(SchoolLoansApi, AGENT_STORAGE_STATE),
  usersApi: withSavedSession(UsersApi, DASHBOARD_USER_STORAGE_STATE),

  // The student has no saved session: the client shares the one the test signs up with
  studentLoansApi: async ({ studentPage }, use) => {
    await use(new StudentLoansApi(studentPage.context().request))
  }
})
