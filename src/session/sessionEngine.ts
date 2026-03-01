import type { SessionEngine } from './types'

export function createSessionEngine(sentences: string[], startIndex = 0): SessionEngine {
  let index = Math.max(0, Math.min(startIndex, Math.max(sentences.length - 1, 0)))

  return {
    currentSentence: () => sentences[index] ?? '',
    currentIndex: () => index,
    next: () => {
      if (index < sentences.length - 1) {
        index += 1
      }

      return sentences[index]
    },
    isComplete: () => sentences.length === 0 || index >= sentences.length - 1
  }
}
