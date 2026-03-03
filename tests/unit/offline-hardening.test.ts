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
})
