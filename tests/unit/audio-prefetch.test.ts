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

  it('treats same sentence with different voices as different cache entries', async () => {
    await prefetchSentenceClip('Olipa kerran.', 'fi')
    await prefetchSentenceClip('Olipa kerran.', 'fi+f3')

    expect(getPrefetchedSentenceClip('Olipa kerran.', 'fi')).toBeDefined()
    expect(getPrefetchedSentenceClip('Olipa kerran.', 'fi+f3')).toBeDefined()
    expect(synthesizeSentence).toHaveBeenCalledTimes(2)
    expect(synthesizeSentence).toHaveBeenNthCalledWith(1, 'Olipa kerran.', { voice: 'fi' })
    expect(synthesizeSentence).toHaveBeenNthCalledWith(2, 'Olipa kerran.', { voice: 'fi+f3' })
  })
})
