import { writeFile } from 'fs/promises'

import type { Page, Request, Response, TestInfo } from '@playwright/test'

const IGNORED_RESOURCE = /\.(js|css|woff2?|png|jpe?g|svg|ico|webp)(\?|$)|vercel\.live/

interface RequestEntry {
  request: string
  startedAtMs: number
  durationMs?: number
  status?: number
  failure?: string
}

export interface NetworkDiagnostics {
  finalUrl: string
  observedForMs: number
  pendingRequests: RequestEntry[]
  completedRequests: RequestEntry[]
  failedRequests: RequestEntry[]
  consoleErrors: string[]
  pageErrors: string[]
}

// Playwright traces only keep requests that finished, so a request that hangs, or one the app
// never sends, leaves no trace there. This records both cases for failed tests.
export class NetworkRecorder {
  private readonly startedAt = Date.now()
  private readonly entries = new Map<Request, RequestEntry>()
  private readonly consoleErrors: string[] = []
  private readonly pageErrors: string[] = []

  constructor(private readonly page: Page) {
    page.on('request', (request) => this.onRequest(request))
    page.on('response', (response) => this.onResponse(response))
    page.on('requestfinished', (request) => this.onFinished(request))
    page.on('requestfailed', (request) => this.onFailed(request))
    page.on('console', (message) => {
      if (message.type() === 'error') {
        this.consoleErrors.push(message.text())
      }
    })
    page.on('pageerror', (error) => this.pageErrors.push(error.message))
  }

  report(): NetworkDiagnostics {
    const entries = [...this.entries.values()]

    return {
      finalUrl: this.page.url(),
      observedForMs: Date.now() - this.startedAt,
      pendingRequests: entries.filter(
        (entry) => entry.durationMs === undefined && entry.failure === undefined
      ),
      completedRequests: entries.filter((entry) => entry.durationMs !== undefined),
      failedRequests: entries.filter((entry) => entry.failure !== undefined),
      consoleErrors: this.consoleErrors,
      pageErrors: this.pageErrors
    }
  }

  private onRequest(request: Request): void {
    if (IGNORED_RESOURCE.test(request.url())) {
      return
    }

    const { host, pathname } = new URL(request.url())

    this.entries.set(request, {
      request: `${request.method()} ${host}${pathname}`,
      startedAtMs: this.elapsedMs()
    })
  }

  private onResponse(response: Response): void {
    const entry = this.entries.get(response.request())

    if (entry) {
      entry.status = response.status()
    }
  }

  private onFinished(request: Request): void {
    const entry = this.entries.get(request)

    if (entry) {
      entry.durationMs = this.elapsedMs() - entry.startedAtMs
    }
  }

  private onFailed(request: Request): void {
    const entry = this.entries.get(request)

    if (entry) {
      entry.failure = request.failure()?.errorText ?? 'unknown'
    }
  }

  private elapsedMs(): number {
    return Date.now() - this.startedAt
  }
}

export async function attachReportOnFailure(
  recorder: NetworkRecorder,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  if (testInfo.status === testInfo.expectedStatus) {
    return
  }

  const path = testInfo.outputPath(`${name}.json`)

  await writeFile(path, JSON.stringify(recorder.report(), null, 2))
  await testInfo.attach(name, { path, contentType: 'application/json' })
}
