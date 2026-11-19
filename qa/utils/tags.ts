// Playwright tags: they filter runs (pnpm test:e2e --grep @smoke) and Allure shows them as tags
export const TAG = {
  smoke: '@smoke',
  regression: '@regression',
  auth: '@auth',
  security: '@security',
  validation: '@validation',
  navigation: '@navigation',
  loans: '@loans',
  student: '@student',
  formalization: '@formalization',
  address: '@address',
  integration: '@integration'
} as const
