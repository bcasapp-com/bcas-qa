import path from 'path'

import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

import { getBaseUrl } from './utils/env'
import { SLOW_TEST_TIMEOUT } from './utils/timeouts'

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true })

const baseURL = getBaseUrl()

export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    // Read by ci/email-summary.mjs to build the results email
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],
  use: {
    baseURL,
    testIdAttribute: 'data-test-id',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      timeout: SLOW_TEST_TIMEOUT,
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
