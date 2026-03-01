import { describe, expect, it } from 'vitest'
import { createSessionEngine } from '../../src/session/sessionEngine'

describe('Session engine', () => {
  it('resumes from persisted sentence index', () => {
    const engine = createSessionEngine(['A.', 'B.', 'C.'], 1)
    expect(engine.currentSentence()).toBe('B.')
  })
})
