import { logEvent } from '../observability/devLogger'

export function splitSentences(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    logEvent('ingestion_splitter', 'split_completed', { sentenceCount: 0 })
    return []
  }

  const matches = normalized.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)
  const sentences = matches?.map((sentence) => sentence.trim()).filter(Boolean) ?? []
  logEvent('ingestion_splitter', 'split_completed', {
    inputLength: text.length,
    normalizedLength: normalized.length,
    sentenceCount: sentences.length
  })
  return sentences
}
