import { describe, expect, it } from 'vitest'
import {
  buildMaskModel,
  extractWordsFromSlots,
  getNextFillableIndex,
  getPreviousFillableIndex,
  isFillableLetter
} from '../../src/play/maskedInputModel'

describe('masked input model', () => {
  it('marks letters as fillable and punctuation as static', () => {
    const model = buildMaskModel('Olipa kerran.')
    expect(model.fillableCount).toBe(11)
    expect(model.tokens.at(-1)?.kind).toBe('static')
    expect(model.tokens.at(-1)?.value).toBe('.')
  })

  it('supports finnish letters as fillable', () => {
    expect(isFillableLetter('ä')).toBe(true)
    expect(isFillableLetter('ö')).toBe(true)
    expect(isFillableLetter('Å')).toBe(true)
    expect(isFillableLetter(' ')).toBe(false)
    expect(isFillableLetter('.')).toBe(false)
  })

  it('extracts words from slot values using sentence spacing', () => {
    const model = buildMaskModel('Olipa kerran.')
    const slots = 'olipakerran'.split('')
    expect(extractWordsFromSlots(model, slots)).toEqual(['olipa', 'kerran'])
  })

  it('can move cursor left and right over fillable slots only', () => {
    const model = buildMaskModel('Olipa kerran.')
    expect(getNextFillableIndex(model, 0)).toBe(1)
    expect(getPreviousFillableIndex(model, 6)).toBe(5)
    expect(getPreviousFillableIndex(model, 0)).toBe(0)
    expect(getNextFillableIndex(model, 10)).toBe(10)
  })
})
