// Builds the HTML body of the results email from the Playwright JSON report.
// Usage: node ci/email-summary.mjs <results.json> <output.html>
// Lists failed and passed tests, and skipped ones only when there are any.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const [inputPath = 'playwright-report/results.json', outputPath = 'email-summary.html'] = process.argv.slice(2)

const escapeHtml = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// Playwright error messages carry terminal colour codes
const stripAnsi = (text) => String(text).replace(/\u001b\[[0-9;]*m/g, '')

const buildInfo = `
  <p style="color:#555">
    Build: <a href="${escapeHtml(process.env.BUILD_URL ?? '')}">${escapeHtml(process.env.JOB_NAME ?? 'local')} #${escapeHtml(process.env.BUILD_NUMBER ?? '0')}</a>
    · Rama: ${escapeHtml(process.env.GIT_BRANCH ?? '-')}
    · <a href="${escapeHtml(process.env.ALLURE_PUBLIC_URL ?? '')}/allure-docker-service/projects/${escapeHtml(process.env.ALLURE_PROJECT ?? '')}/reports/latest/index.html">Reporte Allure</a>
  </p>`

if (!existsSync(inputPath)) {
  writeFileSync(
    outputPath,
    `<h2>Sin resultados</h2><p>Los tests no llegaron a ejecutarse (revisa el log del build).</p>${buildInfo}`
  )
  process.exit(0)
}

const report = JSON.parse(readFileSync(inputPath, 'utf8'))

const failed = []
const passed = []
const skipped = []

const walk = (suite, parents) => {
  const path = suite.title && !suite.title.endsWith('.ts') ? [...parents, suite.title] : parents
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const name = [...path, spec.title].join(' › ')
      const entry = { name, file: spec.file, project: test.projectName }
      if (test.status === 'unexpected') {
        const lastResult = test.results.at(-1)
        const message = stripAnsi(lastResult?.error?.message ?? lastResult?.errors?.[0]?.message ?? '')
        failed.push({ ...entry, error: message.split('\n').find((line) => line.trim()) ?? '' })
      } else if (test.status === 'skipped') {
        skipped.push(entry)
      } else {
        // 'expected' or 'flaky' (passed after a retry)
        passed.push({ ...entry, flaky: test.status === 'flaky' })
      }
    }
  }
  for (const child of suite.suites ?? []) walk(child, path)
}
for (const suite of report.suites ?? []) walk(suite, [])

const row = (t, extra = '') =>
  `<li style="margin-bottom:4px"><b>${escapeHtml(t.name)}</b> <span style="color:#777">(${escapeHtml(t.project)} · ${escapeHtml(t.file)})</span>${extra}</li>`

const section = (title, color, tests, render) =>
  `<h3 style="color:${color};margin-bottom:4px">${title} (${tests.length})</h3>` +
  (tests.length ? `<ul>${tests.map(render).join('')}</ul>` : '<p style="color:#777">Ninguno</p>')

let html = `<div style="font-family:Arial,sans-serif;font-size:14px">
  <h2 style="margin-bottom:4px">${failed.length ? '❌' : '✅'} ${passed.length} pasados · ${failed.length} fallidos${skipped.length ? ` · ${skipped.length} omitidos` : ''}</h2>
  ${buildInfo}`

html += section('Fallidos', '#c62828', failed, (t) =>
  row(t, t.error ? `<br><code style="color:#c62828;font-size:12px">${escapeHtml(t.error)}</code>` : '')
)
html += section('Pasados', '#2e7d32', passed, (t) => row(t, t.flaky ? ' <i style="color:#ef6c00">(pasó tras reintento)</i>' : ''))
if (skipped.length) html += section('Omitidos', '#757575', skipped, (t) => row(t))
html += '</div>'

writeFileSync(outputPath, html)
console.log(`Resumen del email: ${passed.length} pasados, ${failed.length} fallidos, ${skipped.length} omitidos`)
