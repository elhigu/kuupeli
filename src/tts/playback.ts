export interface PlaybackOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

type SpeechSynthesisWithOptionalEvents = SpeechSynthesis & {
  addEventListener?: (type: 'voiceschanged', listener: () => void) => void
  getVoices?: () => SpeechSynthesisVoice[]
  removeEventListener?: (type: 'voiceschanged', listener: () => void) => void
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const normalizedLang = lang.toLocaleLowerCase()
  return (
    voices.find((voice) => voice.lang.toLocaleLowerCase().startsWith(normalizedLang)) ??
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  )
}

function waitForVoices(synthesis: SpeechSynthesisWithOptionalEvents): Promise<SpeechSynthesisVoice[]> {
  if (typeof synthesis.getVoices !== 'function') {
    return Promise.resolve([])
  }

  const existingVoices = synthesis.getVoices()
  if (existingVoices.length > 0) {
    return Promise.resolve(existingVoices)
  }

  return new Promise((resolve) => {
    const onVoicesChanged = () => {
      const voices = synthesis.getVoices?.() ?? []
      if (voices.length > 0) {
        cleanup(voices)
      }
    }

    const timeoutId = window.setTimeout(() => {
      cleanup(synthesis.getVoices?.() ?? [])
    }, 800)

    const cleanup = (voices: SpeechSynthesisVoice[]) => {
      window.clearTimeout(timeoutId)
      synthesis.removeEventListener?.('voiceschanged', onVoicesChanged)
      resolve(voices)
    }

    synthesis.addEventListener?.('voiceschanged', onVoicesChanged)
  })
}

export function playSentenceAudio(text: string, options: PlaybackOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.reject(new Error('Speech synthesis API not available'))
  }

  const synthesis = window.speechSynthesis as SpeechSynthesisWithOptionalEvents
  const canListVoices = typeof synthesis.getVoices === 'function'

  return waitForVoices(synthesis).then((voices) => {
    if (canListVoices && voices.length === 0) {
      throw new Error('No speech voices installed')
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.lang ?? 'fi-FI'
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    utterance.voice = pickVoice(voices, utterance.lang)

    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve()
      utterance.onerror = () => reject(new Error('Speech synthesis failed'))

      synthesis.cancel()
      synthesis.speak(utterance)

      // Some mocked/browser implementations may never fire onend.
      setTimeout(() => resolve(), 0)
    })
  })
}
