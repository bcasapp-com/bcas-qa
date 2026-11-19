export const SLOW_PAGE_TIMEOUT = 30_000

export const SLOW_TEST_TIMEOUT = 4 * SLOW_PAGE_TIMEOUT

// Tests that drive the agent and the student flows one after the other
export const TWO_PORTAL_TEST_TIMEOUT = 2 * SLOW_TEST_TIMEOUT

// Pages served by third parties (PandaDoc, Stripe, Permisso). PandaDoc's bot protection has taken
// over a minute to let a headless browser in
export const THIRD_PARTY_PAGE_TIMEOUT = 2 * 60_000

// Steps confirmed by a provider webhook (PandaDoc, Stripe) or by the HubSpot sync. PandaDoc has a
// server cron every 3 minutes as fallback when its webhook is lost
export const WEBHOOK_TIMEOUT = 3 * 60_000

// Signing, the first payment and the approval wait on webhooks one after the other
export const FORMALIZATION_TEST_TIMEOUT = TWO_PORTAL_TEST_TIMEOUT + 3 * WEBHOOK_TIMEOUT
