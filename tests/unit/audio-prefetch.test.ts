import { describe, expect, it } from 'vitest'
import { AudioPrefetchQueue } from '../../src/tts/audioPrefetchQueue'

describe('Audio prefetch queue', () => {
  it('prefetches next sentence clip', async () => {
    const queue = new AudioPrefetchQueue()
    await queue.prefetch('Sitten tuli ilta.')
    expect(queue.has('Sitten tuli ilta.')).toBe(true)
  })
})
