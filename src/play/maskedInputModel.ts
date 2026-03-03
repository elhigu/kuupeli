export type MaskToken =
  | {
      kind: 'fillable'
      value: string
      slotIndex: number
      wordIndex: number
    }
  | {
      kind: 'static'
      value: string
    }

export interface MaskModel {
  sentence: string
  tokens: MaskToken[]
  fillableCount: number
  wordCount: number
}

const LETTER_PATTERN = /^\p{L}$/u

export function isFillableLetter(char: string): boolean {
  return LETTER_PATTERN.test(char)
}

export function buildMaskModel(sentence: string): MaskModel {
  const tokens: MaskToken[] = []
  let slotIndex = 0
  let wordIndex = 0
  let insideWord = false

  for (const char of Array.from(sentence)) {
    if (isFillableLetter(char)) {
      tokens.push({
        kind: 'fillable',
        value: char,
        slotIndex,
        wordIndex
      })
      slotIndex += 1
      insideWord = true
      continue
    }

    tokens.push({ kind: 'static', value: char })
    if (/\s/.test(char) && insideWord) {
      wordIndex += 1
      insideWord = false
    }
  }

  return {
    sentence,
    tokens,
    fillableCount: slotIndex,
    wordCount: insideWord ? wordIndex + 1 : wordIndex
  }
}

export function extractWordsFromSlots(model: MaskModel, slots: string[]): string[] {
  const words = Array.from({ length: model.wordCount }, () => '')

  for (const token of model.tokens) {
    if (token.kind !== 'fillable') {
      continue
    }

    words[token.wordIndex] += slots[token.slotIndex] ?? ''
  }

  return words
}

export function getNextFillableIndex(model: MaskModel, currentIndex: number): number {
  if (model.fillableCount === 0) {
    return 0
  }

  return Math.min(currentIndex + 1, model.fillableCount - 1)
}

export function getPreviousFillableIndex(_model: MaskModel, currentIndex: number): number {
  return Math.max(currentIndex - 1, 0)
}

export function getFirstFillableIndexForWord(model: MaskModel, wordIndex: number): number {
  const token = model.tokens.find((item) => item.kind === 'fillable' && item.wordIndex === wordIndex)
  if (!token || token.kind !== 'fillable') {
    return 0
  }

  return token.slotIndex
}
