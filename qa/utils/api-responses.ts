import type { Page, Request, Response } from '@playwright/test'

interface ApiEndpoint {
  method: string
  path: string
}

interface WaitForApiResponseOptions {
  // Ignores the failed responses of the endpoint and keeps waiting for a successful one
  isOkRequired?: boolean
}

export const apiEndpoints = {
  completeProfile: { method: 'PATCH', path: '/users/complete-profile' },
  session: { method: 'GET', path: '/auth' }
} satisfies Record<string, ApiEndpoint>

function isEndpointRequest(request: Request, endpoint: ApiEndpoint): boolean {
  return request.method() === endpoint.method && new URL(request.url()).pathname === endpoint.path
}

export function waitForApiResponse(
  page: Page,
  endpoint: ApiEndpoint,
  { isOkRequired = false }: WaitForApiResponseOptions = {}
): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      isEndpointRequest(response.request(), endpoint) && (!isOkRequired || response.ok())
  )
}

export function countApiRequests(page: Page, endpoint: ApiEndpoint): () => number {
  let count = 0

  page.on('request', (request) => {
    if (isEndpointRequest(request, endpoint)) {
      count++
    }
  })

  return () => count
}
