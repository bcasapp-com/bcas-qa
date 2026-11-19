import { expect } from '@playwright/test'

import { LOCKED_TASK_ATTRIBUTE } from '../pages/loan-request-page'

import type { Locator } from '@playwright/test'

export async function expectTaskLocked(
  task: Locator,
  isLocked: boolean,
  message?: string
): Promise<void> {
  await expect(task, message).toHaveAttribute(LOCKED_TASK_ATTRIBUTE, String(isLocked))
}
