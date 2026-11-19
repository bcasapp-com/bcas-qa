import { Severity } from 'allure-js-commons'

import { realAddressSearchText } from '../../data/addresses'
import { AGENT_STORAGE_STATE } from '../../fixtures/storage-states'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import { SLOW_PAGE_TIMEOUT } from '../../utils/timeouts'

// The only spec that reaches the real Google Places search: every other spec mocks it, so this one
// checks just that the integration answers, not which suggestions it returns
test.use({ storageState: AGENT_STORAGE_STATE, mockAddressSearch: false })

test.beforeEach(() => annotateSuite('Financing', 'Address search'))

test(
  'finds and confirms a real address with the Google Places search',
  { tag: [TAG.smoke, TAG.address, TAG.integration] },
  async ({ newLoanPage }) => {
    await annotate({ story: 'Address search against Google Places', severity: Severity.CRITICAL })

    const address = newLoanPage.form.address

    await newLoanPage.open()
    await newLoanPage.form.expandOptionalData()

    await address.search(realAddressSearchText)
    await expect(address.option(0)).toBeVisible({ timeout: SLOW_PAGE_TIMEOUT })
    await address.option(0).click()

    await expect(address.confirmed).toBeVisible({ timeout: SLOW_PAGE_TIMEOUT })
    await expect(address.confirmedValue).not.toBeEmpty()
  }
)
