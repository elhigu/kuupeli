import { describe, expect, it } from 'vitest'
import { scoreStars } from '../../src/scoring/starScorer'

describe('Star scoring', () => {
  it('awards stars based on successful attempt number', () => {
    expect(scoreStars(1)).toBe(3)
    expect(scoreStars(2)).toBe(2)
    expect(scoreStars(4)).toBe(1)
  })
})
