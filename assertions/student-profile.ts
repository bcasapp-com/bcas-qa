import { expect, test } from '@playwright/test'

import type { Response } from '@playwright/test'

// The save request is the one the app sent, so its body proves what reached the server
export async function expectProfileSaved(
  saveResponse: Response,
  expectedPayload: Record<string, unknown> = {}
): Promise<void> {
  await test.step(
    'the profile is saved',
    async () => {
      expect(saveResponse.ok(), 'profile save response').toBe(true)
      expect(saveResponse.request().postDataJSON(), 'profile sent to the server').toMatchObject(
        expectedPayload
      )
    },
    { box: true }
  )
}
