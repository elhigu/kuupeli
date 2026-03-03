import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { shouldServeFromCache } from '../../src/offline/cachePolicy'

describe('Cache policy', () => {
  it('serves app shell assets from cache when offline', () => {
    expect(shouldServeFromCache('/assets/main.js')).toBe(true)
    expect(shouldServeFromCache('/api/something')).toBe(false)
  })

  it('normalizes query/hash paths before cache decision', () => {
    expect(shouldServeFromCache('/assets/main.js?v=1#chunk')).toBe(true)
    expect(shouldServeFromCache('/play?from=home')).toBe(true)
  })

  it('defines deterministic workbox runtime caching for pages and static assets', () => {
    const config = fs.readFileSync('vite.config.ts', 'utf8')
    expect(config).toMatch(/runtimeCaching:\s*\[/)
    expect(config).toMatch(/handler:\s*'NetworkFirst'/)
    expect(config).toMatch(/handler:\s*'StaleWhileRevalidate'/)
    expect(config).toMatch(/cacheName:\s*'kuupeli-pages'/)
    expect(config).toMatch(/cacheName:\s*'kuupeli-assets'/)
  })
})
