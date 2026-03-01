import { describe, expect, it } from 'vitest'
import { STARTER_SENTENCES } from '../../src/data/starterSentences'

describe('Starter sentence pack', () => {
  it('contains 50 built-in Finnish practice sentences', () => {
    expect(STARTER_SENTENCES).toHaveLength(50)
    expect(STARTER_SENTENCES.every((sentence) => sentence.trim().length > 0)).toBe(true)
  })
})
