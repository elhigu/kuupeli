import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playSentenceAudioWithModel } from '../../src/tts/playback'

vi.mock('../../src/models/modelManager', () => ({
  getModelById: vi.fn(() => ({
    id: 'fi-starter-small',
    engine: 'espeak-ng',
    piperVoiceId: undefined,
    voiceTypes: [{ id: 'fi-default', runtimeVoice: 'fi' }]
  })),
  getModelVoiceType: vi.fn(async () => 'fi-default'),
  getActiveModel: vi.fn(async () => 'fi-starter-small')
}))

vi.mock('../../src/tts/ttsRuntime', () => ({
  synthesizeSentence: vi.fn(async () => {
    throw new Error('force-fallback')
  })
}))

describe('Playback concurrency', () => {
  beforeEach(() => {
    const cancel = vi.fn()
    const speak = vi.fn()

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel, speak }
    })

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: function SpeechSynthesisUtterance(
        this: { text: string; onend?: () => void; onerror?: () => void },
        text: string
      ) {
        this.text = text
      }
    })
  })

  it('cancels prior playback before starting a new one', async () => {
    const first = playSentenceAudioWithModel('Ensimmäinen lause.', { modelId: 'fi-starter-small' })
    const second = playSentenceAudioWithModel('Toinen lause.', { modelId: 'fi-starter-small' })

    await expect(first).resolves.toBeUndefined()
    await expect(second).resolves.toBeUndefined()

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
  })
})
