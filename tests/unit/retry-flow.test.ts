import { describe, expect, it } from 'vitest'
import { findInvalidWords } from '../../src/scoring/retryEvaluator'

describe('Retry evaluator', () => {
  it('returns invalid word indexes', () => {
    const invalid = findInvalidWords('Olipa kerran kauan sitten', 'Olipa kerran kauna sitten')
    expect(invalid).toEqual([2])
  })
})
