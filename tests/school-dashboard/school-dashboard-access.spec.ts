import { Severity } from 'allure-js-commons'

import { routes } from '../../data/routes'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import { urlPath } from '../../utils/url'

test.describe(
  'School dashboard — access control',
  { tag: [TAG.regression, TAG.auth, TAG.security] },
  () => {
    test('redirects an unauthenticated visitor to login', async ({ page, schoolDashboardPage }) => {
      await annotateSuite('Authentication', 'Access control')
      await annotate({
        story: 'Redirect unauthenticated visitor on school dashboard',
        severity: Severity.CRITICAL
      })

      await schoolDashboardPage.goto()

      await expect(page).toHaveURL(urlPath(routes.login))
    })
  }
)
