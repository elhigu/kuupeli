import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Vite pages base configuration', () => {
  it('supports configurable base path for production deploys', () => {
    const config = fs.readFileSync('vite.config.ts', 'utf8')
    expect(config).toMatch(/process\.env\.VITE_BASE_PATH/)
    expect(config).toMatch(/base:\s+basePath/)
    expect(config).toMatch(/start_url:\s+basePath/)
    expect(config).toMatch(/scope:\s+basePath/)
  })
})
