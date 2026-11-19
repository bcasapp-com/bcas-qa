import { test as base } from '@playwright/test'

import { mockAddressSearch } from './address-search-mock'
import { attachReportOnFailure, NetworkRecorder } from './network-diagnostics'
import { AGENT_STORAGE_STATE } from './storage-states'
import { TEST_LOCALE } from '../data/app-labels'
import { CookieBanner } from '../pages/components/cookie-banner'

import type { Browser, BrowserContextOptions, Page, TestInfo } from '@playwright/test'

interface PagePreparation {
  baseURL: string | undefined
  isAddressSearchMocked: boolean
}

// Every page the tests drive starts the same way: Spanish app, mocked address search unless the
// spec turns it off, and cookies rejected whenever the consent banner shows up
async function preparePage(
  page: Page,
  { baseURL, isAddressSearchMocked }: PagePreparation
): Promise<void> {
  await page.context().addCookies([{ name: 'lang', value: TEST_LOCALE, url: baseURL }])
  if (isAddressSearchMocked) {
    await mockAddressSearch(page.context())
  }
  await new CookieBanner(page).rejectWhenShown()
}

interface IsolatedPageOptions extends PagePreparation {
  storageState: BrowserContextOptions['storageState']
  reportName: string
}

async function useIsolatedPage(
  browser: Browser,
  { storageState, reportName, ...preparation }: IsolatedPageOptions,
  testInfo: TestInfo,
  use: (page: Page) => Promise<void>
): Promise<void> {
  const context = await browser.newContext({ baseURL: preparation.baseURL, storageState })
  const page = await context.newPage()
  await preparePage(page, preparation)
  const recorder = new NetworkRecorder(page)

  await use(page)

  await attachReportOnFailure(recorder, testInfo, reportName)
  await context.close()
}

interface BrowserOptions {
  // Turned off only by the specs that check the real Google Places search
  mockAddressSearch: boolean
}

interface BrowserFixtures {
  agentPage: Page
  studentPage: Page
  networkDiagnostics: void
}

export const test = base.extend<BrowserOptions & BrowserFixtures>({
  mockAddressSearch: [true, { option: true }],

  page: async ({ page, baseURL, mockAddressSearch: isAddressSearchMocked }, use) => {
    await preparePage(page, { baseURL, isAddressSearchMocked })
    await use(page)
  },

  agentPage: async (
    { browser, baseURL, mockAddressSearch: isAddressSearchMocked },
    use,
    testInfo
  ) => {
    await useIsolatedPage(
      browser,
      {
        baseURL,
        isAddressSearchMocked,
        storageState: AGENT_STORAGE_STATE,
        reportName: 'agent-network-diagnostics'
      },
      testInfo,
      use
    )
  },

  studentPage: async (
    { browser, baseURL, mockAddressSearch: isAddressSearchMocked },
    use,
    testInfo
  ) => {
    await useIsolatedPage(
      browser,
      {
        baseURL,
        isAddressSearchMocked,
        storageState: { cookies: [], origins: [] },
        reportName: 'student-network-diagnostics'
      },
      testInfo,
      use
    )
  },

  networkDiagnostics: [
    async ({ page }, use, testInfo) => {
      const recorder = new NetworkRecorder(page)

      await use()

      await attachReportOnFailure(recorder, testInfo, 'network-diagnostics')
    },
    { auto: true }
  ]
})
