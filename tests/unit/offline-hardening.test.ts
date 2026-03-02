import { describe, expect, it } from 'vitest'
import { shouldServeFromCache } from '../../src/offline/cachePolicy'

describe('Cache policy', () => {
  it('serves app shell assets from cache when offline', () => {
    expect(shouldServeFromCache('/assets/main.js')).toBe(true)
    expect(shouldServeFromCache('/api/something')).toBe(false)
  })
})
