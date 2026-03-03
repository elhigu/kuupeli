import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/tts/ttsRuntime', () => ({
  synthesizeSentence: vi.fn(async (text: string) => new TextEncoder().encode(text).buffer)
}))

vi.mock('../../src/models/modelManager', () => ({
  getActiveModel: vi.fn(async () => 'fi-starter-small'),
  getModelById: vi.fn(() => ({
    id: 'fi-starter-small',
    engine: 'espeak-ng',
    piperVoiceId: undefined,
    voiceTypes: [
      {
        id: 'fi-default',
        runtimeVoice: 'fi'
      }
    ]
  })),
  getModelVoiceType: vi.fn(async () => 'fi-default')
}))

import { prefetchSentenceClip, resetPrefetchQueueForTest } from '../../src/tts/audioPrefetchQueue'
import { playSentenceAudio } from '../../src/tts/playback'
import { synthesizeSentence } from '../../src/tts/ttsRuntime'

class FakeAudio {
  onended: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(_src: string) {}

  play() {
    queueMicrotask(() => this.onended?.())
    return Promise.resolve()
  }
}

describe('Playback prefetch cache', () => {
  beforeEach(() => {
    resetPrefetchQueueForTest()
    vi.clearAllMocks()
    vi.stubGlobal('Audio', FakeAudio)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:kuupeli-test'),
      revokeObjectURL: vi.fn()
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('plays prefetched clip without regenerating audio', async () => {
    const sentence = 'Sitten tuli ilta.'

    await prefetchSentenceClip(sentence)
    await playSentenceAudio(sentence)

    expect(synthesizeSentence).toHaveBeenCalledTimes(1)
  })
})
