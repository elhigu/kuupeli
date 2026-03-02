import { logEvent } from '../observability/devLogger'

function normalizeWord(word: string): string {
  return word
    .trim()
    .toLocaleLowerCase('fi-FI')
    .replace(/[.,!?;:()"']/g, '')
}

export function findInvalidWords(target: string, input: string): number[] {
  const targetWords = target.split(/\s+/).map(normalizeWord)
  const inputWords = input.split(/\s+/).map(normalizeWord)

  const maxLen = Math.max(targetWords.length, inputWords.length)
  const invalidIndexes: number[] = []

  for (let i = 0; i < maxLen; i += 1) {
    if ((targetWords[i] ?? '') !== (inputWords[i] ?? '')) {
      invalidIndexes.push(i)
    }
  }

  logEvent('retry_evaluator', 'invalid_words_computed', {
    targetWordCount: targetWords.length,
    inputWordCount: inputWords.length,
    invalidCount: invalidIndexes.length
  })
  return invalidIndexes
}
