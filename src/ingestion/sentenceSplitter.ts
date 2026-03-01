export function splitSentences(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return []
  }

  const matches = normalized.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)
  return matches?.map((sentence) => sentence.trim()).filter(Boolean) ?? []
}
