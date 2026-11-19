import { Severity } from 'allure-js-commons'

import { routes } from '../../data/routes'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import { urlPath } from '../../utils/url'

test.describe(
  'Agent dashboard — access control',
  { tag: [TAG.regression, TAG.auth, TAG.security] },
  () => {
    test('redirects an unauthenticated visitor to login', async ({ page, dashboardPage }) => {
      await annotateSuite('Authentication', 'Access control')
      await annotate({
        story: 'Redirect unauthenticated visitor on agent dashboard',
        severity: Severity.CRITICAL
      })

      await dashboardPage.goto()

      await expect(page).toHaveURL(urlPath(routes.login))
    })
  }
)
