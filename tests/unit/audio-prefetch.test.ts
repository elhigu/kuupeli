import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/tts/ttsRuntime', () => ({
  synthesizeSentence: vi.fn(async (text: string) => new TextEncoder().encode(text).buffer)
}))

import { getPrefetchedSentenceClip, prefetchSentenceClip, resetPrefetchQueueForTest } from '../../src/tts/audioPrefetchQueue'
import { synthesizeSentence } from '../../src/tts/ttsRuntime'

describe('Audio prefetch queue', () => {
  beforeEach(() => {
    resetPrefetchQueueForTest()
    vi.clearAllMocks()
  })

  it('prefetches and reuses cached sentence clip', async () => {
    await prefetchSentenceClip('Sitten tuli ilta.')
    await prefetchSentenceClip('Sitten tuli ilta.')

    expect(getPrefetchedSentenceClip('Sitten tuli ilta.')).toBeDefined()
    expect(synthesizeSentence).toHaveBeenCalledTimes(1)
  })

  it('deduplicates concurrent prefetch requests for same sentence and voice', async () => {
    await Promise.all([prefetchSentenceClip('Olipa kerran.'), prefetchSentenceClip('Olipa kerran.')])

    expect(getPrefetchedSentenceClip('Olipa kerran.')).toBeDefined()
    expect(synthesizeSentence).toHaveBeenCalledTimes(1)
  })
})
