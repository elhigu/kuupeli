import type { SessionEngine } from './types'
import { logEvent } from '../observability/devLogger'

export function createSessionEngine(sentences: string[], startIndex = 0): SessionEngine {
  let index = Math.max(0, Math.min(startIndex, Math.max(sentences.length - 1, 0)))
  logEvent('session_engine', 'created', {
    sentenceCount: sentences.length,
    startIndex,
    normalizedIndex: index
  })

  return {
    currentSentence: () => {
      const sentence = sentences[index] ?? ''
      logEvent('session_engine', 'current_sentence_requested', {
        index,
        sentenceLength: sentence.length
      })
      return sentence
    },
    currentIndex: () => {
      logEvent('session_engine', 'current_index_requested', { index })
      return index
    },
    next: () => {
      if (index < sentences.length - 1) {
        index += 1
        logEvent('session_engine', 'advanced', { index })
      } else {
        logEvent('session_engine', 'advance_ignored_at_end', { index })
      }

      return sentences[index]
    },
    isComplete: () => {
      const complete = sentences.length === 0 || index >= sentences.length - 1
      logEvent('session_engine', 'is_complete_checked', { index, complete })
      return complete
    }
  }
}
