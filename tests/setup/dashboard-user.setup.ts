import { getCredentials } from '../../data/test-users'
import { DASHBOARD_USER_STORAGE_STATE } from '../../fixtures/storage-states'
import { test as setup } from '../../fixtures/test'
import { annotateSuite } from '../../utils/allure'

setup('authenticate as dashboard user', async ({ page, loginPage, dashboardPage }) => {
  await annotateSuite('Test setup', 'Shared dashboard user session')

  await loginPage.open()
  await loginPage.loginAs(getCredentials('dashboardUser'))
  await dashboardPage.waitForLoaded()

  // Firebase keeps the client session in IndexedDB
  await page.context().storageState({ path: DASHBOARD_USER_STORAGE_STATE, indexedDB: true })
})
