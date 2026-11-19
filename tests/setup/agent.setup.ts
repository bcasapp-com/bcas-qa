import { getCredentials } from '../../data/test-users'
import { AGENT_STORAGE_STATE } from '../../fixtures/storage-states'
import { test as setup } from '../../fixtures/test'
import { annotateSuite } from '../../utils/allure'

setup('authenticate as agent', async ({ page, loginPage, schoolDashboardPage }) => {
  await annotateSuite('Test setup', 'Shared agent session')

  await loginPage.open()
  await loginPage.loginAs(getCredentials('agent'))
  await schoolDashboardPage.waitForLoaded()

  // Firebase keeps the client session in IndexedDB
  await page.context().storageState({ path: AGENT_STORAGE_STATE, indexedDB: true })
})
