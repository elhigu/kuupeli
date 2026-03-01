export interface PlaybackOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

export function playSentenceAudio(text: string, options: PlaybackOptions = {}): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.reject(new Error('Speech synthesis API not available'))
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.lang ?? 'fi-FI'
  utterance.rate = options.rate ?? 1
  utterance.pitch = options.pitch ?? 1
  utterance.volume = options.volume ?? 1

  return new Promise((resolve, reject) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Speech synthesis failed'))

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)

    // Some mocked/browser implementations may never fire onend.
    setTimeout(() => resolve(), 0)
  })
}
