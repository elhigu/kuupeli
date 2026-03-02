import { describe, expect, it, vi } from 'vitest'
import { playSentenceAudio } from '../../src/tts/playback'

describe('Audio playback voice fallback', () => {
  it('still calls speak when voice list is empty', async () => {
    const speak = vi.fn()
    const cancel = vi.fn()

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel,
        speak,
        getVoices: () => []
      }
    })

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: function SpeechSynthesisUtterance(
        this: {
          text: string
          lang: string
          rate: number
          pitch: number
          volume: number
          voice: SpeechSynthesisVoice | null
          onend?: () => void
          onerror?: () => void
        },
        text: string
      ) {
        this.text = text
        this.lang = ''
        this.rate = 1
        this.pitch = 1
        this.volume = 1
        this.voice = null
      }
    })

    await expect(playSentenceAudio('Olipa kerran.')).resolves.toBeUndefined()
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(speak).toHaveBeenCalledTimes(1)
  })
})
