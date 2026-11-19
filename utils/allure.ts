import { test } from '@playwright/test'
import { epic, feature, parameter, severity, story } from 'allure-js-commons'

import type { Severity } from 'allure-js-commons'

interface TestAnnotations {
  story: string
  severity: Severity
}

export async function annotateSuite(epicName: string, featureName: string): Promise<void> {
  await epic(epicName)
  await feature(featureName)
}

// Tags are not set here: they go in the test details, where Playwright can filter by them
export async function annotate(annotations: TestAnnotations): Promise<void> {
  await story(annotations.story)
  await severity(annotations.severity)
}

// Records a value the test picked at random, so a failure can be reproduced from the report.
// It stays out of the Allure history id, which would otherwise change on every run
export async function recordTestData(name: string, value: string): Promise<void> {
  test.info().annotations.push({ type: name, description: value })
  await parameter(name, value, { excluded: true })
}
