import { Severity } from 'allure-js-commons'

import { routes } from '../../data/routes'
import {
  getCredentials,
  invalidCredentialsUser,
  recoveryTestEmail,
  sqaSchoolId,
  sqaSchoolName,
  unregisteredTestEmail
} from '../../data/test-users'
import { expect, test } from '../../fixtures/test'
import { annotate, annotateSuite } from '../../utils/allure'
import { TAG } from '../../utils/tags'
import { SLOW_PAGE_TIMEOUT } from '../../utils/timeouts'
import { urlPath } from '../../utils/url'

interface PasswordResetScenario {
  title: string
  story: string
  email: string
  tag: string[]
}

// The confirmation must not reveal whether the email has an account
const PASSWORD_RESET_SCENARIOS: PasswordResetScenario[] = [
  {
    title: 'allows a user to request a password reset',
    story: 'Navigation to the password recovery page',
    email: recoveryTestEmail,
    tag: [TAG.regression, TAG.navigation]
  },
  {
    title: 'shows the same confirmation for a non-existent email',
    story: 'Password recovery for an unregistered email',
    email: unregisteredTestEmail,
    tag: [TAG.regression, TAG.security]
  }
]

test.describe('Login', { tag: TAG.auth }, () => {
  test.beforeEach(() => annotateSuite('Authentication', 'Login'))

  test(
    'allows a dashboard user to log in with valid credentials',
    { tag: TAG.smoke },
    async ({ page, loginPage, dashboardPage }) => {
      await annotate({
        story: 'Log in with valid dashboard user credentials',
        severity: Severity.BLOCKER
      })

      const dashboardUser = getCredentials('dashboardUser')

      await loginPage.open()
      await loginPage.loginAs(dashboardUser)

      await expect(dashboardPage.sidebar).toBeVisible()
      await expect(page).toHaveURL(urlPath(routes.dashboard))

      await dashboardPage.userMenu.open()

      await expect(dashboardPage.userMenu.email).toHaveText(dashboardUser.email)
    }
  )

  test(
    'blocks the login of a malformed email',
    { tag: [TAG.regression, TAG.validation] },
    async ({ page, loginPage }) => {
      await annotate({ story: 'Login form validation', severity: Severity.MINOR })

      await loginPage.open()
      await loginPage.login('not-an-email', 'any-password')

      await expect(loginPage.emailInput).toBeFocused()
      await expect(loginPage.invalidEmailInput).toBeVisible()
      await expect(page).toHaveURL(urlPath(routes.login))
    }
  )

  test(
    'rejects invalid credentials with an error message',
    { tag: [TAG.regression, TAG.security] },
    async ({ loginPage }) => {
      await annotate({ story: 'Rejection of invalid credentials', severity: Severity.CRITICAL })

      await loginPage.open()
      await loginPage.login(invalidCredentialsUser.email, invalidCredentialsUser.password)

      await expect(loginPage.invalidCredentialsError).toBeVisible()
    }
  )

  test(
    'allows a dashboard user to log out',
    { tag: TAG.smoke },
    async ({ page, loginPage, dashboardPage }) => {
      await annotate({ story: 'Dashboard user logout', severity: Severity.BLOCKER })

      await loginPage.open()
      await loginPage.loginAs(getCredentials('dashboardUser'))
      await dashboardPage.waitForLoaded()

      await dashboardPage.userMenu.logout()

      await expect(page).toHaveURL(urlPath(routes.login))
    }
  )

  for (const scenario of PASSWORD_RESET_SCENARIOS) {
    test(scenario.title, { tag: scenario.tag }, async ({ page, loginPage, resetPasswordPage }) => {
      await annotate({ story: scenario.story, severity: Severity.NORMAL })

      await loginPage.open()
      await loginPage.forgotPasswordLink.click()

      await expect(page).toHaveURL(urlPath(routes.forgotPassword))

      await resetPasswordPage.requestReset(scenario.email)

      await expect(resetPasswordPage.confirmationMessage).toBeVisible()
    })
  }

  test(
    'allows a student to log in with valid credentials',
    { tag: TAG.smoke },
    async ({ page, loginPage }) => {
      await annotate({ story: 'Log in with valid student credentials', severity: Severity.BLOCKER })

      await loginPage.open()
      await loginPage.loginAs(getCredentials('student'))

      await expect(page).toHaveURL(urlPath(routes.studentFirstView), { timeout: SLOW_PAGE_TIMEOUT })
    }
  )

  test('allows a student to log out', { tag: TAG.smoke }, async ({ page, loginPage, loanPage }) => {
    await annotate({ story: 'Student logout', severity: Severity.BLOCKER })

    await loginPage.open()
    await loginPage.loginAs(getCredentials('student'))
    await loanPage.waitForLoaded()

    await loanPage.userMenu.logout()

    await expect(page).toHaveURL(urlPath(routes.login))
  })

  test(
    'allows an agent to log in with valid credentials',
    { tag: TAG.smoke },
    async ({ page, loginPage, schoolDashboardPage }) => {
      await annotate({ story: 'Log in with valid agent credentials', severity: Severity.BLOCKER })

      await loginPage.open()
      await loginPage.loginAs(getCredentials('agent'))

      await expect(page).toHaveURL(urlPath(routes.schoolDashboard(sqaSchoolId)))
      await expect(schoolDashboardPage.sidebarContent).toBeVisible()

      await expect(schoolDashboardPage.currentSchoolName).toHaveText(sqaSchoolName)
    }
  )

  test(
    'allows an agent to log out',
    { tag: TAG.smoke },
    async ({ page, loginPage, schoolDashboardPage }) => {
      await annotate({ story: 'Agent logout', severity: Severity.BLOCKER })

      await loginPage.open()
      await loginPage.loginAs(getCredentials('agent'))
      await schoolDashboardPage.waitForLoaded()

      await schoolDashboardPage.userMenu.logout()

      await expect(page).toHaveURL(urlPath(routes.login))
    }
  )
})
