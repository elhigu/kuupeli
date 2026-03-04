import { describe, expect, it } from 'vitest'
import {
  readStarProgress,
  summarizeStarProgress,
  upsertSentenceStars,
  writeStarProgress
} from '../../src/scoring/starProgress'

describe('Star progress', () => {
  it('upserts sentence stars and preserves best result for same sentence', () => {
    const first = upsertSentenceStars({}, 0, 2)
    expect(first[0]).toBe(2)

    const second = upsertSentenceStars(first, 0, 1)
    expect(second[0]).toBe(2)

    const third = upsertSentenceStars(second, 0, 3)
    expect(third[0]).toBe(3)
  })

  it('persists and reads normalized star progress from localStorage', () => {
    const progress = { 0: 3, 1: 2 } as const
    writeStarProgress(progress)

    expect(readStarProgress()).toEqual({ 0: 3, 1: 2 })
  })

  it('summarizes completed sentences and star totals', () => {
    const summary = summarizeStarProgress({ 0: 3, 1: 2, 5: 1 }, 50)
    expect(summary.completedSentences).toBe(3)
    expect(summary.earnedStars).toBe(6)
    expect(summary.maxStars).toBe(150)
  })
})
