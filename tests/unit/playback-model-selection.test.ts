import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playSentenceAudio } from '../../src/tts/playback'

const mocks = vi.hoisted(() => ({
  synthesizeSentence: vi.fn(async () => new Uint8Array([1, 2, 3]).buffer),
  predictPiperVoice: vi.fn(async () => new Uint8Array([4, 5, 6]).buffer)
}))

vi.mock('../../src/tts/ttsRuntime', () => ({
  synthesizeSentence: mocks.synthesizeSentence
}))

vi.mock('../../src/tts/piperWebRuntime', () => ({
  predictPiperVoice: mocks.predictPiperVoice
}))

class FakeAudio {
  onended: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(_src: string) {}

  play() {
    queueMicrotask(() => this.onended?.())
    return Promise.resolve()
  }
}

describe('Playback model selection', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('uses selected eSpeak voice type for active model', async () => {
    localStorage.setItem('kuupeli-active-model', 'fi-starter-small')
    localStorage.setItem('kuupeli-model-voice-types', JSON.stringify({ 'fi-starter-small': 'fi-female-3' }))

    await playSentenceAudio('Olipa kerran.')

    expect(mocks.synthesizeSentence).toHaveBeenCalledWith('Olipa kerran.', { voice: 'fi+f3' })
    expect(mocks.predictPiperVoice).not.toHaveBeenCalled()
  })

  it('uses piper runtime for active downloadable model', async () => {
    localStorage.setItem('kuupeli-active-model', 'fi-piper-harri-low')
    localStorage.setItem(
      'kuupeli-installed-models',
      JSON.stringify(['fi-starter-small', 'fi-balanced-medium', 'fi-piper-harri-low'])
    )

    await playSentenceAudio('Sitten tuli ilta.')

    expect(mocks.predictPiperVoice).toHaveBeenCalledWith('fi_FI-harri-low', 'Sitten tuli ilta.')
  })
})
