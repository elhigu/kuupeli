import { describe, expect, it } from 'vitest'
import { ClipCache } from '../../src/tts/clipCache'

describe('ClipCache', () => {
  it('evicts oldest clips when capacity is exceeded', () => {
    const cache = new ClipCache(2)

    cache.set('A', new Uint8Array([1]).buffer)
    cache.set('B', new Uint8Array([2]).buffer)
    cache.set('C', new Uint8Array([3]).buffer)

    expect(cache.has('A')).toBe(false)
    expect(cache.has('B')).toBe(true)
    expect(cache.has('C')).toBe(true)
  })
})
