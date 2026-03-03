import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Playwright subpath config', () => {
  it('runs e2e against /kuupeli build preview', () => {
    const config = fs.readFileSync('playwright.config.ts', 'utf8')
    expect(config).toMatch(/baseURL:\s*'http:\/\/127\.0\.0\.1:4173\/kuupeli\/'/)
    expect(config).toMatch(/VITE_BASE_PATH=\/kuupeli\/ npm run build/)
    expect(config).toMatch(/subpathPreviewServer\.mjs 4173/)
    expect(config).toMatch(/url:\s*'http:\/\/127\.0\.0\.1:4173\/kuupeli\/'/)
  })
})
